import 'leaflet/dist/leaflet.css';
import { FC, Fragment, useEffect, useState } from 'react';
import L, { LatLngExpression } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, ZoomControl, Tooltip } from "react-leaflet";
import { mapLayers } from '../../constants/osm-maptiler';
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

const MapComponent: FC<MapComponentProps> = ({
    campuses,
    campusSpecies,
    handleModal,
    selectedMapLayer = 'esri',
    campusId,
    coordinatesParams,
    categoryParam,
    scientificNameParam,
    zoomLevel = 40
}) => {

    const [coordinates, setCoordinates] = useState<LatLngExpression>(() => {
        // Initialize with proper coordinates from URL or first campus
        if (coordinatesParams) {
            const coords = coordinatesParams.split(',').map((coordinate) => Number(coordinate));
            return [coords[1], coords[0]];
        }
        return [0, 0];
    });
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const [selectedFilters, setSelectedFilters] = useState<string[]>(() => {
        // Initialize filter based on category from URL or default to birds
        return categoryParam ? [categoryParam] : [SpeciesCategory.BIRDS];
    });
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 640);

    // Adjust zoom level for mobile
    const getResponsiveZoom = () => {
        if (isMobile) {
            // Set default zoom to 30 on mobile, or use provided zoom level
            const defaultMobileZoom = 30;
            // If zoom is the default 40, use mobile default of 30
            // Otherwise use the provided zoom (e.g., from search which is 20)
            return zoomLevel === 40 ? defaultMobileZoom : zoomLevel;
        }
        return zoomLevel ?? 40;
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
    }, [campusId, coordinatesParams, categoryParam, campuses, campusSpecies]);


    const MoveTo = ({ coordinates }: { coordinates: LatLngExpression }) => {
        const map = useMap();
        // Only update the view when coordinates actually change, preserve user's zoom level
        useEffect(() => {
            map.setView(coordinates, getResponsiveZoom());
        }, [coordinates]);
        return null;
    }

    const handleMarkerClick = (data: ICampusSpecies) => {
        handleModal(data);
    }

    return (
        <Fragment>
            <div className="w-full h-screen relative">
                {/* Filter buttons */}
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-[1000] bg-white rounded-lg shadow-lg p-2 sm:p-2.5 max-w-[200px] sm:max-w-none">
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
                                <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                            </button>
                        ))}
                        <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap w-full sm:w-auto text-center sm:text-left sm:ml-1 font-medium">
                            ({filteredCampusSpecies.length}/{campusSpecies.length})
                        </span>
                    </div>
                </div>

                <MapContainer center={coordinates} zoom={getResponsiveZoom()} scrollWheelZoom={true} zoomControl={false}>
                    <TileLayer
                        key={selectedMapLayer}
                        url={mapLayers[selectedMapLayer as keyof typeof mapLayers]?.url || mapLayers.esri.url}
                        attribution={mapLayers[selectedMapLayer as keyof typeof mapLayers]?.attribution || mapLayers.esri.attribution}
                    />
                    {
                        filteredCampusSpecies.map((data, index) => {
                            // Check if this species matches the search (has same scientific name)
                            const isMatch = !scientificNameParam ||
                                (scientificNameParam && data.speciesData?.scientificName === decodeURIComponent(scientificNameParam));
                            const opacity = isMatch ? 1 : 0.3;
                            const categoryIcon = createCategoryIcon(data.speciesData?.category, opacity);
                            return <Marker
                                key={index}
                                position={[Number(data.latitude), Number(data.longitude)]}
                                icon={categoryIcon}
                                eventHandlers={{
                                    click: () => handleMarkerClick(data)
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
                        campuses.map((campus, index) => (
                            <Marker
                                key={index}
                                position={[Number(campus.longitude), Number(campus.latitude)]}
                                icon={createSchoolIcon(campus.campus)}
                            >
                                <Tooltip>
                                    <div>
                                        <strong>{campus.campus.toUpperCase()} CAMPUS</strong>
                                    </div>
                                </Tooltip>
                            </Marker>
                        ))
                    }
                    <ZoomControl position='bottomright' />
                    <MoveTo coordinates={coordinates} />
                </MapContainer>
            </div>
        </Fragment>

    )
}

export default MapComponent;