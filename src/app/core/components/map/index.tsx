import 'leaflet/dist/leaflet.css';
import { FC, Fragment, useEffect, useRef, useState } from 'react';
import type { GeoJsonObject } from 'geojson';
import L, { LatLngExpression } from "leaflet";
import { GeoJSON, MapContainer, Marker, TileLayer, useMap, ZoomControl, Tooltip } from "react-leaflet";
import { toast } from 'react-toastify';
import { mapLayers } from '../../constants/osm-maptiler';
import { campusBoundaryMap } from '../../constants/boundaries';
import mapPin from '../../../../assets/pin2.png'
import schoolPin from '../../../../assets/schoolmap-pin.png'
import birdIcon from '../../../../assets/pngs/bird.png'
import batIcon from '../../../../assets/pngs/bat.png'
import treeIcon from '../../../../assets/pngs/tree.png'
import mangroveIcon from '../../../../assets/pngs/mangrove.png'
import butterflyIcon from '../../../../assets/pngs/butterfly.png'
import dragonflyIcon from '../../../../assets/pngs/dragonfly.png'
import damselflyIcon from '../../../../assets/pngs/damselfly.png'
import frogIcon from '../../../../assets/pngs/frog.png'
import macroInvertsIcon from '../../../../assets/pngs/macro_inverts.png'
import { ICampus, ICampusSpecies } from '../../interfaces/common.interface';
import fallbackImage from "../../../../assets/fallback-image.jpg";
import { SpeciesCategory } from '../../enums/species';

type MapComponentProps = {
    campuses: ICampus[];
    campusSpecies: ICampusSpecies[];
    handleModal: (data: ICampusSpecies) => void;
    selectedMapLayer?: string;
    campusId?: string | null;
    coordinatesParams?: string | null;
    categoryParam?: string | null;
    scientificNameParam?: string | null;
    zoomLevel?: number;
    editable?: boolean;
    onMarkerCoordinateChange?: (speciesId: string | number, latitude: number, longitude: number) => Promise<boolean> | boolean;
    fitParentHeight?: boolean;
};


// Define a custom icon
const escapeHtml = (value: string) => {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const createSchoolIcon = (campusName: string) => {
    const formattedCampusName = `${campusName.toUpperCase()} CAMPUS`;
    const safeName = escapeHtml(formattedCampusName);

    return L.divIcon({
        className: 'custom-school-icon',
        html: `
            <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-8px);">
                <img src="${schoolPin}" style="width:44px;height:44px;object-fit:contain;" alt="School marker" />
                <span style="margin-top:2px;padding:2px 6px;border-radius:999px;background:rgba(255,255,255,0.92);border:1px solid #d1d5db;color:#1f2937;font-size:10px;font-weight:600;line-height:1;white-space:nowrap;">
                    ${safeName}
                </span>
            </div>
        `,
        iconSize: [96, 64],
        iconAnchor: [48, 52],
        popupAnchor: [0, -50],
    });
};

// Map category icons
const categoryIconMap: Record<string, string> = {
    [SpeciesCategory.BIRDS]: birdIcon,
    [SpeciesCategory.BATS]: batIcon,
    [SpeciesCategory.TREES]: treeIcon,
    [SpeciesCategory.MANGROVES]: mangroveIcon,
    [SpeciesCategory.BUTTERFLY]: butterflyIcon,
    [SpeciesCategory.DRAGONFLY]: dragonflyIcon,
    [SpeciesCategory.DAMSELFLY]: damselflyIcon,
    [SpeciesCategory.FROGS]: frogIcon,
    [SpeciesCategory.MACRO_INVERTS]: macroInvertsIcon,
};

// Get category icon for filter button
const getFilterIcon = (category: string) => {
    return categoryIconMap[category] || mapPin;
};

// Function to create icon based on category
const createCategoryIcon = (category: string | undefined, opacity: number = 1) => {
    const iconUrl = category ? categoryIconMap[category.toLowerCase()] || mapPin : mapPin;
    return L.icon({
        iconUrl: iconUrl,
        iconSize: [35, 35],
        iconAnchor: [17, 35],
        popupAnchor: [0, -35],
        className: opacity < 1 ? 'category-marker-icon faded-marker' : 'category-marker-icon',
    });
};

const normalizeCampusName = (value?: string | null) => value?.toLowerCase().replace(/[^a-z0-9]+/g, '') ?? '';

const isUstpCdoCampus = (name?: string | null) => {
    const normalized = normalizeCampusName(name);
    return normalized.includes('ustpcdo') || (normalized.includes('ustp') && normalized.includes('cdo'));
};

const isNearUstpCdoCoordinates = (value: LatLngExpression | null | undefined) => {
    if (!Array.isArray(value) || value.length < 2) return false;

    const lat = Number(value[0]);
    const lng = Number(value[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

    return Math.abs(lat - 8.4868) < 0.08 && Math.abs(lng - 124.655) < 0.08;
};

const isValidLatLng = (lat: number, lng: number) => (
    Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= -90
    && lat <= 90
    && lng >= -180
    && lng <= 180
);

const resolveLatLng = (first: number, second: number): [number, number] | null => {
    if (isValidLatLng(first, second)) return [first, second];
    if (isValidLatLng(second, first)) return [second, first];
    return null;
};

type BoundaryGeometry = {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
};

const extractBoundaryGeometries = (boundary: unknown): BoundaryGeometry[] => {
    if (!boundary || typeof boundary !== 'object') return [];

    const boundaryData = boundary as {
        type?: string;
        features?: Array<{ geometry?: { type?: string; coordinates?: unknown } }>;
        geometry?: { type?: string; coordinates?: unknown };
        coordinates?: unknown;
    };

    if (boundaryData.type === 'FeatureCollection' && Array.isArray(boundaryData.features)) {
        return boundaryData.features
            .map((feature) => feature.geometry)
            .filter((geometry): geometry is BoundaryGeometry => Boolean(geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')));
    }

    if (boundaryData.type === 'Feature' && boundaryData.geometry && (boundaryData.geometry.type === 'Polygon' || boundaryData.geometry.type === 'MultiPolygon')) {
        return [boundaryData.geometry as BoundaryGeometry];
    }

    if (boundaryData.type === 'Polygon' || boundaryData.type === 'MultiPolygon') {
        return [{
            type: boundaryData.type,
            coordinates: boundaryData.coordinates as number[][][] | number[][][][],
        }];
    }

    return [];
};

const isPointInsideRing = (lat: number, lng: number, ring: number[][]) => {
    if (!Array.isArray(ring) || ring.length < 3) return false;

    let inside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
        const xi = Number(ring[i][0]);
        const yi = Number(ring[i][1]);
        const xj = Number(ring[j][0]);
        const yj = Number(ring[j][1]);

        const intersects = ((yi > lat) !== (yj > lat))
            && (lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi);

        if (intersects) inside = !inside;
    }

    return inside;
};

const isPointInsideBoundaryGeometry = (lat: number, lng: number, geometry: BoundaryGeometry) => {
    if (geometry.type === 'Polygon') {
        const [outerRing, ...holes] = geometry.coordinates as number[][][];
        if (!isPointInsideRing(lat, lng, outerRing)) return false;

        return !holes.some((hole) => isPointInsideRing(lat, lng, hole));
    }

    return (geometry.coordinates as number[][][][]).some((polygon) => {
        const [outerRing, ...holes] = polygon;
        if (!isPointInsideRing(lat, lng, outerRing)) return false;

        return !holes.some((hole) => isPointInsideRing(lat, lng, hole));
    });
};

type MapViewControllerProps = {
    center: LatLngExpression;
    zoom: number;
    triggerRecenter: number;
};

const MapViewController: FC<MapViewControllerProps> = ({ center, zoom, triggerRecenter }) => {
    const map = useMap();
    const previousCenterRef = useRef<L.LatLng | null>(null);
    const previousZoomRef = useRef<number | null>(null);
    const previousTriggerRef = useRef<number>(0);

    useEffect(() => {
        const nextCenter = L.latLng(center as L.LatLngExpression);
        const hasRecenterRequest = triggerRecenter > previousTriggerRef.current;
        const hasCenterChanged = !previousCenterRef.current || previousCenterRef.current.distanceTo(nextCenter) > 0.5;
        const hasZoomChanged = previousZoomRef.current === null || previousZoomRef.current !== zoom;

        if (hasRecenterRequest || hasCenterChanged || hasZoomChanged) {
            map.setView(nextCenter, zoom);
        }

        previousCenterRef.current = nextCenter;
        previousZoomRef.current = zoom;
        previousTriggerRef.current = triggerRecenter;
    }, [center, map, triggerRecenter, zoom]);

    return null;
};

const MapComponent: FC<MapComponentProps> = ({
    campuses,
    campusSpecies,
    handleModal,
    selectedMapLayer = 'esri',
    campusId,
    coordinatesParams,
    categoryParam,
    scientificNameParam,
    zoomLevel = 40,
    editable = false,
    onMarkerCoordinateChange,
    fitParentHeight = false,
}) => {
    const [showBoundary, setShowBoundary] = useState(true);
    const [isBoundaryHovered, setIsBoundaryHovered] = useState(false);
    const [isCoordinateSaving, setIsCoordinateSaving] = useState(false);
    const [recenterVersion, setRecenterVersion] = useState(0);
    const [hasInitializedView, setHasInitializedView] = useState(false);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);
    const [coordinates, setCoordinates] = useState<LatLngExpression>(() => {
        // Initialize with proper coordinates from URL or first campus
        if (coordinatesParams) {
            const coords = coordinatesParams.split(',').map((coordinate) => Number(coordinate));
            return [coords[1], coords[0]];
        }
        return [0, 0];
    });
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const selectedCampus = campuses.find((campus) => String(campus.id) === String(campusId));
    const getBoundaryKey = (value?: string | null) => {
        const normalizedValue = normalizeCampusName(value);

        if (!normalizedValue) return '';
        if (normalizedValue.includes('ustpcdo') || normalizedValue.includes('cdo')) return 'ustpcdo';
        if (normalizedValue.includes('ustpvillanueva') || normalizedValue.includes('villanueva')) return 'ustpvillanueva';
        if (normalizedValue.includes('ustpclaveria') || normalizedValue.includes('claveria')) return 'ustpclaveria';
        if (normalizedValue.includes('ustpjasaan') || normalizedValue.includes('jasaan')) return 'ustpjasaan';
        if (normalizedValue.includes('ustporoquieta') || normalizedValue.includes('oroquieta')) return 'ustporoquieta';
        if (normalizedValue.includes('ustppanaon') || normalizedValue.includes('panaon')) return 'ustppanaon';

        return normalizedValue;
    };

    const boundaryLookupCandidates = [
        getBoundaryKey(campusId ? String(campusId) : ''),
        getBoundaryKey(selectedCampus?.campus),
        ...campuses.map((campus) => getBoundaryKey(campus.campus)),
    ].filter(Boolean);

    const isCdoCampusContext = isUstpCdoCampus(campusId)
        || isUstpCdoCampus(selectedCampus?.campus)
        || isNearUstpCdoCoordinates(coordinates)
        || campusId === '1';

    if (isCdoCampusContext) {
        boundaryLookupCandidates.push('ustpcdo');
    }

    const matchingBoundaryLayers = Array.from(new Set(boundaryLookupCandidates))
        .map((boundaryKey) => campusBoundaryMap[boundaryKey as keyof typeof campusBoundaryMap])
        .filter(Boolean);
    const shouldShowBoundaryControl = matchingBoundaryLayers.length > 0 || isNearUstpCdoCoordinates(coordinates) || campusId === 'ustpcdo' || campusId === '1';
    const [selectedFilters, setSelectedFilters] = useState<string[]>(() => {
        // Preview/edit pages should show all species by default; landing keeps birds default.
        if (categoryParam) return [categoryParam];
        return editable ? Object.values(SpeciesCategory) : [SpeciesCategory.BIRDS];
    });

    // Adjust zoom level for a comfortable map view
    const getResponsiveZoom = () => {
        const fallbackZoom = isCdoCampusContext ? 18 : 17;
        const requestedZoom = Number.isFinite(zoomLevel) && zoomLevel > 0 ? zoomLevel : fallbackZoom;
        const normalizedZoom = requestedZoom === 40 ? fallbackZoom : requestedZoom;

        if (isCdoCampusContext && normalizedZoom === 17) {
            return 18;
        }

        return Math.min(30, Math.max(1, normalizedZoom));
    };

    const initialZoom = getResponsiveZoom();

    useEffect(() => {
        if (campuses.some((campus) => isUstpCdoCampus(campus.campus)) || isNearUstpCdoCoordinates(coordinates) || campusId === 'ustpcdo' || campusId === '1') {
            setShowBoundary(true);
        }
    }, [campuses, coordinates, campusId]);

    const toggleFilter = (category: string) => {
        setSelectedFilters(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const toggleAllFilters = () => {
        if (selectedFilters.length === Object.values(SpeciesCategory).length) {
            setSelectedFilters([]);
        } else {
            setSelectedFilters(Object.values(SpeciesCategory));
        }
    };

    const filteredCampusSpecies = campusSpecies.filter(species =>
        selectedFilters.includes(species.speciesData?.category?.toLowerCase() || '')
    );

    useEffect(() => {
        if (hasInitializedView) return;

        if (campusId && coordinatesParams) {
            const coords = coordinatesParams.split(',').map((coordinate) => Number(coordinate));
            setCoordinates([coords[1], coords[0]]);

            // Update filter if category is provided
            if (categoryParam) {
                setSelectedFilters([categoryParam]);
            }
        } else if (campuses.length > 0) {
            const campus = campuses[0];
            setCoordinates([Number(campus.latitude), Number(campus.longitude)]);
        }

        setHasInitializedView(true);
    }, [campusId, coordinatesParams, categoryParam, campuses, campusSpecies, hasInitializedView]);

    useEffect(() => {
        if (!hasInitializedView) return;

        if (campusId && coordinatesParams) {
            const coords = coordinatesParams.split(',').map((coordinate) => Number(coordinate));
            setCoordinates([coords[1], coords[0]]);
            return;
        }

        if (campuses.length > 0) {
            const campus = campuses[0];
            setCoordinates([Number(campus.latitude), Number(campus.longitude)]);
        }
    }, [campusId, coordinatesParams, campuses, hasInitializedView]);

    const handleRecenter = () => {
        setRecenterVersion((prev) => prev + 1);
    };

    const RecenterControl = ({ onClick }: { onClick: () => void }) => {
        const map = useMap();

        useEffect(() => {
            const control = new L.Control({ position: 'bottomright' });
            const container = L.DomUtil.create('div', 'leaflet-bar recenter-control');
            container.style.marginRight = '10px';
            container.style.marginBottom = '10px';

            const button = document.createElement('button');
            button.type = 'button';
            button.innerHTML = '⌖';
            button.title = 'Re-center map';
            button.setAttribute('aria-label', 'Re-center map');
            button.style.width = '36px';
            button.style.height = '36px';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.background = '#ffffff';
            button.style.border = 'none';
            button.style.cursor = 'pointer';
            button.style.color = '#1f2937';
            button.style.fontSize = '20px';
            button.style.lineHeight = '1';

            button.addEventListener('click', onClick);
            L.DomEvent.disableClickPropagation(container);
            container.appendChild(button);

            control.onAdd = () => container;
            control.addTo(map);

            return () => {
                control.remove();
            };
        }, [map, onClick]);

        return null;
    };

    const handleMarkerClick = (data: ICampusSpecies) => {
        if (editable) return;
        handleModal(data);
    }

    const isInsideAnyBoundary = (lat: number, lng: number) => {
        if (matchingBoundaryLayers.length === 0) return true;

        return matchingBoundaryLayers.some((boundary) => {
            const geometries = extractBoundaryGeometries(boundary);
            return geometries.some((geometry) => isPointInsideBoundaryGeometry(lat, lng, geometry));
        });
    };

    const handleMarkerDragEnd = (data: ICampusSpecies) => {
        return async (event: L.DragEndEvent) => {
            const marker = event.target as L.Marker;
            const previousLat = Number(data.latitude);
            const previousLng = Number(data.longitude);
            const { lat, lng } = marker.getLatLng();

            if (!editable && !isInsideAnyBoundary(lat, lng)) {
                marker.setLatLng([previousLat, previousLng]);
                toast.warning('Point must stay inside campus boundary.');
                return;
            }

            if (!onMarkerCoordinateChange || data.id === undefined) {
                if (!editable) {
                    marker.setLatLng([previousLat, previousLng]);
                }
                return;
            }

            try {
                setIsCoordinateSaving(true);
                const isUpdated = await onMarkerCoordinateChange(data.id, lat, lng);

                if (!isUpdated) {
                    if (!editable) {
                        marker.setLatLng([previousLat, previousLng]);
                    }
                    return;
                }

                toast.success('Species coordinates updated.');
            } catch {
                if (!editable) {
                    marker.setLatLng([previousLat, previousLng]);
                }
                toast.error('Unable to update marker coordinates.');
            } finally {
                setIsCoordinateSaving(false);
            }
        };
    };

    const fallbackCenter: [number, number] = [8.4868, 124.655];
    const mapCenterCandidate = Array.isArray(coordinates) && coordinates.length >= 2
        ? resolveLatLng(Number(coordinates[0]), Number(coordinates[1]))
        : null;
    const safeMapCenter = mapCenterCandidate ?? fallbackCenter;

    return (
        <Fragment>
            <div className={`w-full relative ${fitParentHeight ? 'h-full min-h-0' : 'h-screen'}`}>
                {/* Filter buttons */}
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-[1000] max-w-[260px] sm:max-w-none">
                    <div className="flex items-center justify-start mb-1.5">
                        <button
                            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
                            className="text-xs sm:text-sm px-2.5 py-1 rounded-full bg-white border border-gray-300 hover:bg-gray-50 shadow font-medium"
                        >
                            {isFilterPanelOpen ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>

                    {isFilterPanelOpen && (
                        <div className="bg-white rounded-lg shadow-lg p-2 sm:p-2.5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
                                <button
                                    onClick={toggleAllFilters}
                                    className="text-xs sm:text-sm px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 whitespace-nowrap w-full sm:w-auto font-medium"
                                >
                                    {selectedFilters.length === Object.values(SpeciesCategory).length ? 'Clear' : 'All'}
                                </button>
                                {Object.values(SpeciesCategory).map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => toggleFilter(category)}
                                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap w-full sm:w-auto flex items-center justify-center gap-1.5 ${selectedFilters.includes(category)
                                            ? 'bg-white text-green-700 border border-green-600'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={getFilterIcon(category)}
                                            alt={category}
                                            className="hidden sm:inline w-4 h-4 sm:w-5 sm:h-5"
                                        />
                                        <span>{category === SpeciesCategory.MACRO_INVERTS ? 'Macro Inverts' : category.charAt(0).toUpperCase() + category.slice(1)}</span>
                                    </button>
                                ))}
                                <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap w-full sm:w-auto text-center sm:text-left sm:ml-1 font-medium">
                                    ({filteredCampusSpecies.length}/{campusSpecies.length})
                                </span>
                                {editable && (
                                    <span className="text-[11px] text-amber-700 whitespace-nowrap w-full sm:w-auto text-center sm:text-left sm:ml-1 font-medium">
                                        {isCoordinateSaving ? 'Saving coordinates...' : 'Edit mode enabled'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <MapContainer className={`map-layer-${selectedMapLayer}`} center={safeMapCenter} zoom={initialZoom} maxZoom={18} minZoom={1} scrollWheelZoom={true} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        key={selectedMapLayer}
                        url={mapLayers[selectedMapLayer as keyof typeof mapLayers]?.url || mapLayers.esri.url}
                        attribution={mapLayers[selectedMapLayer as keyof typeof mapLayers]?.attribution || mapLayers.esri.attribution}
                    />
                    {
                        filteredCampusSpecies.map((data, index) => {
                            const speciesPosition = resolveLatLng(Number(data.latitude), Number(data.longitude));
                            if (!speciesPosition) return null;

                            // Check if this species matches the search (has same scientific name)
                            const isMatch = !scientificNameParam ||
                                (scientificNameParam && data.speciesData?.scientificName === decodeURIComponent(scientificNameParam));
                            const opacity = isMatch ? 1 : 0.3;
                            const categoryIcon = createCategoryIcon(data.speciesData?.category, opacity);
                            return <Marker
                                key={`${index}-${editable ? 'edit' : 'view'}`}
                                position={speciesPosition}
                                icon={categoryIcon}
                                draggable={editable}
                                eventHandlers={{
                                    click: () => handleMarkerClick(data),
                                    ...(editable ? { dragend: handleMarkerDragEnd(data) } : {}),
                                }}
                            >
                                <Tooltip>
                                    <div className="flex flex-row text-sm">
                                        <div className='border-r-2 w-20 mr-2'>
                                            {data.speciesData?.gdriveid &&
                                                <img
                                                    src={`https://drive.google.com/thumbnail?id=${data.speciesData.gdriveid}&sz=w1000`}
                                                    alt={data.speciesData.commonName ?? ''}
                                                    onLoad={() => setImageLoaded(true)}
                                                    className={`hover:cursor-pointer hover:opacity-90 ${imageLoaded ? 'block' : 'hidden'}`}
                                                    onError={e => e.currentTarget.src = fallbackImage}
                                                    width={75}
                                                />
                                            }
                                            {
                                                !data.speciesData?.gdriveid &&
                                                <div className="flex justify-center">
                                                    <img
                                                        src={`https://drive.google.com/thumbnail?id=${data.speciesData?.gdriveid}&sz=w1000`}
                                                        alt={data.speciesData?.commonName ?? ''}
                                                        onLoad={() => setImageLoaded(true)}
                                                        className={`hover:cursor-pointer hover:opacity-90 ${imageLoaded ? 'block' : 'hidden'}`}
                                                        onError={e => e.currentTarget.src = fallbackImage}
                                                    />
                                                </div>
                                            }
                                        </div>
                                        <div>
                                            <strong>{data.speciesData?.commonName || 'Unknown Species'}</strong>
                                            <br />
                                            <em>{data.speciesData?.scientificName}</em>
                                            <br />
                                            <span className="text-xs text-gray-600">
                                                Category: {data.speciesData?.category}
                                            </span>
                                            <br />
                                            <span className="text-xs text-gray-500">
                                                Lat: {Number(data.latitude).toFixed(6)},
                                                Lng: {Number(data.longitude).toFixed(6)}
                                            </span>
                                        </div>
                                    </div>
                                </Tooltip>
                            </Marker>
                        })
                    }
                    {
                        campuses.map((campus, index) => {
                            const campusPosition = resolveLatLng(Number(campus.longitude), Number(campus.latitude));
                            if (!campusPosition) return null;

                            return (
                                <Marker
                                    key={index}
                                    position={campusPosition}
                                    icon={createSchoolIcon(campus.campus)}
                                >
                                    <Tooltip>
                                        <div>
                                            <strong>{campus.campus.toUpperCase()} CAMPUS</strong>
                                        </div>
                                    </Tooltip>
                                </Marker>
                            );
                        })
                    }
                    {showBoundary && shouldShowBoundaryControl && matchingBoundaryLayers.map((boundary, index) => (
                        <GeoJSON
                            key={`${boundary?.name ?? 'boundary'}-${index}`}
                            data={boundary as unknown as GeoJsonObject}
                            interactive={!editable}
                            style={{
                                color: (!editable && isBoundaryHovered) ? '#15803d' : '#16a34a',
                                weight: (!editable && isBoundaryHovered) ? 5 : 3,
                                fillColor: (!editable && isBoundaryHovered) ? '#4ade80' : '#86efac',
                                fillOpacity: (!editable && isBoundaryHovered) ? 0.35 : 0.2,
                            }}
                            eventHandlers={editable ? undefined : {
                                mouseover: () => setIsBoundaryHovered(true),
                                mouseout: () => setIsBoundaryHovered(false),
                            }}
                        />
                    ))}
                    <ZoomControl position='bottomright' />
                    <RecenterControl onClick={handleRecenter} />
                    <MapViewController center={safeMapCenter} zoom={initialZoom} triggerRecenter={recenterVersion} />
                </MapContainer>
            </div>
        </Fragment>

    )
}

export default MapComponent;