import 'leaflet/dist/leaflet.css';
import { FC, Fragment, useEffect, useState } from 'react';
import L, { LatLngExpression } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, ZoomControl, Tooltip } from "react-leaflet";
import { mapLayers } from '../../constants/osm-maptiler';
import mapPin from '../../../../assets/pin2.png'
import schoolPin from '../../../../assets/schoolmap-pin.png'
import birdIcon from '../../../../assets/svgs/bird.svg'
import batIcon from '../../../../assets/svgs/bat.svg'
import treeIcon from '../../../../assets/svgs/tree.svg'
import mangroveIcon from '../../../../assets/svgs/mangrove.svg'
import butterflyIcon from '../../../../assets/svgs/butterfly.svg'
import dragonflyIcon from '../../../../assets/svgs/dragonfly.svg'
import damselflyIcon from '../../../../assets/svgs/damselfly.svg'
import frogIcon from '../../../../assets/svgs/frog.svg'
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
    zoomLevel?: number;
};


// Define a custom icon
const schoolIcon = L.icon({
    iconUrl: schoolPin, // URL to your custom icon
    iconSize: [50, 50], // Size of the icon [width, height]
    iconAnchor: [25, 50], // Anchor point of the icon [x, y] - centered bottom
    popupAnchor: [0, -50], // Anchor for the popup [x, y]
});

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

// Get SVG icon for filter button
const getFilterIcon = (category: string) => {
    return categoryIconMap[category] || mapPin;
};

// Function to create icon based on category
const createCategoryIcon = (category: string | undefined, isHighlighted: boolean = false) => {
    const iconUrl = category ? categoryIconMap[category.toLowerCase()] || mapPin : mapPin;
    return L.icon({
        iconUrl: iconUrl,
        iconSize: isHighlighted ? [50, 50] : [35, 35],
        iconAnchor: isHighlighted ? [25, 50] : [17, 35],
        popupAnchor: [0, isHighlighted ? -50 : -35],
        className: isHighlighted ? 'highlighted-marker' : '',
    });
};

const MapComponent: FC<MapComponentProps> = ({
    campuses,
    campusSpecies,
    handleModal,
    selectedMapLayer = 'satellite',
    campusId,
    coordinatesParams,
    categoryParam,
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
    const [highlightedSpecies, setHighlightedSpecies] = useState<string | null>(null);
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

                // Find and highlight the species at these coordinates
                const targetSpecies = campusSpecies.find(
                    species => species.latitude === coords[1].toString() && species.longitude === coords[0].toString()
                );
                if (targetSpecies && targetSpecies.id) {
                    setHighlightedSpecies(targetSpecies.id.toString());
                } else {
                    setHighlightedSpecies(null);
                }
            } else {
                // No category means no search is active, clear highlight
                setHighlightedSpecies(null);
            }
        } else if (campuses.length > 0) {
            const campus = campuses[0];
            setCoordinates([Number(campus.latitude), Number(campus.longitude)]);
            setHighlightedSpecies(null);
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
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 sm:p-4 max-w-[220px] sm:max-w-none">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <button
                            onClick={toggleAllFilters}
                            className="text-sm sm:text-base px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 whitespace-nowrap w-full sm:w-auto font-medium"
                        >
                            {selectedFilters.length === Object.values(SpeciesCategory).length ? 'Clear' : 'All'}
                        </button>
                        {Object.values(SpeciesCategory).map((category) => (
                            <button
                                key={category}
                                onClick={() => toggleFilter(category)}
                                className={`px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-medium transition-colors whitespace-nowrap w-full sm:w-auto flex items-center justify-center gap-2 ${selectedFilters.includes(category)
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                <img
                                    src={getFilterIcon(category)}
                                    alt={category}
                                    className="w-5 h-5 sm:w-6 sm:h-6"
                                />
                                <span className="hidden sm:inline">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                            </button>
                        ))}
                        <span className="text-sm sm:text-base text-gray-600 whitespace-nowrap w-full sm:w-auto text-center sm:text-left sm:ml-1 font-medium">
                            ({filteredCampusSpecies.length}/{campusSpecies.length})
                        </span>
                    </div>
                </div>

                <MapContainer center={coordinates} zoom={getResponsiveZoom()} scrollWheelZoom={true} zoomControl={false}>
                    <TileLayer
                        key={selectedMapLayer}
                        url={mapLayers[selectedMapLayer as keyof typeof mapLayers]?.url || mapLayers.satellite.url}
                        attribution={mapLayers[selectedMapLayer as keyof typeof mapLayers]?.attribution || mapLayers.satellite.attribution}
                    />
                    {
                        filteredCampusSpecies.map((data, index) => {
                            const isHighlighted = highlightedSpecies === data.id?.toString();
                            const categoryIcon = createCategoryIcon(data.speciesData?.category, isHighlighted);
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
                                icon={schoolIcon}
                            >
                                <Tooltip>
                                    <div>
                                        <strong>{campus.campus} Campus</strong>
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