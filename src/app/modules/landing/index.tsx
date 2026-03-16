import { Fragment, useEffect, useState, useCallback } from "react";
import USTPLogo from '../../../assets/ustp-logo-on-white.png';
import MapComponent from "../../core/components/map";
import { IoMenu, IoClose, IoHome } from "react-icons/io5";
import { BiMapPin } from "react-icons/bi";
import { FaSearch, FaLayerGroup } from "react-icons/fa";
import { useSearchParams, useNavigate } from "react-router-dom";
import Modal from "../../core/components/modal";
import SpeciesDetails from "../../core/components/speciesdetails";
import birdIcon from '../../../assets/pngs/bird.png';
import batIcon from '../../../assets/pngs/bat.png';
import treeIcon from '../../../assets/pngs/tree.png';
import mangroveIcon from '../../../assets/pngs/mangrove.png';
import butterflyIcon from '../../../assets/pngs/butterfly.png';
import dragonflyIcon from '../../../assets/pngs/dragonfly.png';
import damselflyIcon from '../../../assets/pngs/damselfly.png';
import frogIcon from '../../../assets/pngs/frog.png';
import defaultFeather from '../../../assets/feathers/Feathers.png';
import biodiversityLogo from '../../../assets/biodiversity-green.png';
import ustpBioBackground from '../../../assets/ustp-bio.jpg';
import cdoFeather from '../../../assets/feathers/CDO.png';
import claveriaFeather from '../../../assets/feathers/Claveria.png';
import jasaanFeather from '../../../assets/feathers/Jasaan.png';
import villanuevaFeather from '../../../assets/feathers/Villanueva.png';
import alubijidFeather from '../../../assets/feathers/Alubijid.png';
import oroquietaFeather from '../../../assets/feathers/Oroquieta.png';
import panaonFeather from '../../../assets/feathers/Panaon.png';
import { ICampus, ICampusSpecies } from "../../core/interfaces/common.interface";
import { supabase } from "../../core/lib/supabase";
import { SpeciesCategory } from "../../core/enums/species";
import { toast } from "react-toastify";

const speciesModalIconMap: Record<string, string> = {
    [SpeciesCategory.BIRDS]: birdIcon,
    [SpeciesCategory.BATS]: batIcon,
    [SpeciesCategory.TREES]: treeIcon,
    [SpeciesCategory.MANGROVES]: mangroveIcon,
    [SpeciesCategory.BUTTERFLY]: butterflyIcon,
    [SpeciesCategory.DRAGONFLY]: dragonflyIcon,
    [SpeciesCategory.DAMSELFLY]: damselflyIcon,
    [SpeciesCategory.FROGS]: frogIcon,
};

const campusFeatherMap: { keywords: string[]; image: string }[] = [
    { keywords: ['cdo', 'cagayan de oro'], image: cdoFeather },
    { keywords: ['claveria'], image: claveriaFeather },
    { keywords: ['jasaan'], image: jasaanFeather },
    { keywords: ['villanueva'], image: villanuevaFeather },
    { keywords: ['alubijid'], image: alubijidFeather },
    { keywords: ['oroquieta'], image: oroquietaFeather },
    { keywords: ['panaon'], image: panaonFeather },
];

const campusFeatherColorMap: { keywords: string[]; color: string }[] = [
    { keywords: ['alubijid'], color: '#FF3131' },
    { keywords: ['cdo', 'cagayan de oro'], color: '#004AAD' },
    { keywords: ['panaon'], color: '#8C52FF' },
    { keywords: ['claveria'], color: '#FFDE59' },
    { keywords: ['jasaan'], color: '#FF66C4' },
    { keywords: ['oroquieta'], color: '#FF914D' },
    { keywords: ['villanueva'], color: '#000000' },
];

const GENERIC_FEATHER_DURATION_MS = 3000;
const CAMPUS_FEATHER_PREVIEW_MS = 1200;

export default function Landing() {

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const campusId = searchParams.get('campusId');
    const coordinatesParams = searchParams.get('coordinates');
    // const { getCampuses } = useCampusStore();
    // const campuses = useCampusStore(state => state.campuses);
    // const { getCampusSpecies } = useCampusSpeciesStore();
    // const campusSpecies = useCampusSpeciesStore(state => state.campusSpecies);
    const [selectedCampusId, setSelectedCampusId] = useState<string | number | undefined>("");
    const [speciesModal, setSpeciesModal] = useState<boolean>(false);
    const toggleSpeciesModal = () => setSpeciesModal(!speciesModal);
    const [campuses, setCampuses] = useState<ICampus[]>([]);
    const [campusSpecies, setCampusSpecies] = useState<ICampusSpecies[]>([]);
    const [allCampusSpecies, setAllCampusSpecies] = useState<ICampusSpecies[]>([]);
    const [specie, setSpecie] = useState<ICampusSpecies | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchModal, setSearchModal] = useState<boolean>(false);
    const toggleSearchModal = () => setSearchModal(!searchModal);
    const [campusModal, setCampusModal] = useState<boolean>(false);
    const toggleCampusModal = () => setCampusModal(!campusModal);
    const [mapLayerModal, setMapLayerModal] = useState<boolean>(false);
    const toggleMapLayerModal = () => setMapLayerModal(!mapLayerModal);
    const [selectedMapLayer, setSelectedMapLayer] = useState<string>('esri');
    const [currentSearchedSpecies, setCurrentSearchedSpecies] = useState<ICampusSpecies | null>(null);

    const date = new Date();
    const [showPanel, setShowPanel] = useState<boolean>(false);
    // const [showModal, setShowModal] = useState<boolean>(false);
    const [isShowMap, setIsShowMap] = useState<boolean>(false);
    // const toggleShowModal = () => setShowModal(!showModal);
    const toggleShowPanel = () => setShowPanel(!showPanel);
    const [selectedCampusData, setSelectedCampusData] = useState<ICampus | null>(null);
    const [showCampusFeather, setShowCampusFeather] = useState<boolean>(false);

    // Redirect to home if no campusId is provided
    useEffect(() => {
        if (!campusId) {
            navigate('/');
        }
    }, [campusId, navigate]);

    const getCampusSpecies = async (campusId: string | number | undefined) => {
        const table = "campus_species";
        try {
            const response = await supabase
                .from(table)
                .select("*, campusData:campus(*), speciesData:species(*)")
                .order("campus", { ascending: true })
                .eq("campus", campusId)
                .is("deleted_at", null);

            if (response.error) {
                toast.error(response.error.message);
                return;
            }
            return response.data as ICampusSpecies[];
        } catch (error: unknown) {
            toast.error((error as Error).message);
            return null;
        }
    }

    const fetchSpecies = useCallback(async (campusId: string) => {
        const campusSpeciesData = await getCampusSpecies(campusId) ?? [];
        setCampusSpecies(campusSpeciesData);
        campusSpeciesData.map((specie) => {
            if (specie.id) {
                return { value: (specie?.id ?? '').toString(), text: specie.speciesData?.commonName ?? "" };
            }
            return undefined;
        }).filter((item): item is { value: string; text: string } => item !== undefined);
    }, []);

    const getCampuses = useCallback(async () => {
        const table = "campus";
        try {
            const response = await supabase
                .from(table)
                .select("*")
                .order("campus", { ascending: true })
                .is("deleted_at", null);

            if (response.error) {
                toast.error(response.error.message);
                return;
            }

            const campusesData = response.data as ICampus[];
            setCampuses(campusesData);

            // Only process if campusId exists (already checked in useEffect, but double-check)
            if (campusId) {
                const targetCampusId = campusId;
                setSelectedCampusId(campusId);
                const campusData = campusesData.find(campus => campus.id?.toString() === targetCampusId?.toString());

                // Set the selected campus data for the transition screen
                if (campusData) {
                    setSelectedCampusData(campusData);
                }

                // Fetch species for the selected campus
                fetchSpecies(targetCampusId);
            }
        } catch (error: unknown) {
            toast.error((error as Error).message);
            return null;
        }
    }, [campusId, fetchSpecies]);

    const getAllCampusSpecies = useCallback(async () => {
        const table = "campus_species";
        try {
            const response = await supabase
                .from(table)
                .select("*, campusData:campus(*), speciesData:species(*)")
                .order("campus", { ascending: true })
                .is("deleted_at", null);

            if (response.error) {
                toast.error(response.error.message);
                return;
            }
            setAllCampusSpecies(response.data as ICampusSpecies[]);
        } catch (error: unknown) {
            toast.error((error as Error).message);
            return null;
        }
    }, []);


    const handleModal = (data: ICampusSpecies) => {
        setSpecie(data);
        toggleSpeciesModal();
    }

    const handleChangeCampus = (value: string) => {
        const campusData = campuses.find(campus => campus.id?.toString() === value.toString());
        if (campusData) {
            window.location.href = `/map?campusId=${campusData.id}&coordinates=${campusData.latitude},${campusData.longitude}&zoom=${campusData.zoom}`;
            toggleCampusModal();
        }
    }

    const handleBackToHome = () => {
        navigate('/');
    }

    const handleChangeMapLayer = (layer: string) => {
        setSelectedMapLayer(layer);
        toggleMapLayerModal();
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
    }

    const getSpecieHeaderIcon = () => {
        const category = specie?.speciesData?.category?.toLowerCase();
        if (!category) {
            return null;
        }
        return speciesModalIconMap[category] ?? null;
    };

    const getCampusTransitionFeather = () => {
        const campusName = selectedCampusData?.campus?.toLowerCase() || '';
        const matchedCampus = campusFeatherMap.find((item) =>
            item.keywords.some((keyword) => campusName.includes(keyword))
        );
        return matchedCampus?.image ?? defaultFeather;
    };

    const getCampusFeatherByName = (campusName?: string) => {
        const normalizedCampusName = campusName?.toLowerCase() || '';
        const matchedCampus = campusFeatherMap.find((item) =>
            item.keywords.some((keyword) => normalizedCampusName.includes(keyword))
        );
        return matchedCampus?.image ?? defaultFeather;
    };

    const getCampusTransitionTextColor = () => {
        const campusName = selectedCampusData?.campus?.toLowerCase() || '';
        const matchedCampus = campusFeatherColorMap.find((item) =>
            item.keywords.some((keyword) => campusName.includes(keyword))
        );
        return matchedCampus?.color ?? '#004AAD';
    };

    const specieHeaderIcon = getSpecieHeaderIcon();

    const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const foundSpecie = allCampusSpecies.find((specie) => {
                const commonName = specie.speciesData?.commonName?.toLowerCase() || '';
                const scientificName = specie.speciesData?.scientificName?.toLowerCase() || '';
                const category = specie.speciesData?.category?.toLowerCase() || '';
                return commonName.includes(query) || scientificName.includes(query) || category.includes(query);
            });
            if (foundSpecie) {
                const category = foundSpecie.speciesData?.category?.toLowerCase();
                const scientificName = encodeURIComponent(foundSpecie.speciesData?.scientificName || '');
                window.location.href = `/map?campusId=${foundSpecie.campus}&coordinates=${foundSpecie.longitude},${foundSpecie.latitude}&category=${category}&scientificName=${scientificName}&zoom=20`;
                setSearchQuery("");
                toggleSearchModal();
            } else {
                toast.info(`No species found matching "${searchQuery}"`);
            }
        }
    }

    const filteredSpecies = allCampusSpecies.filter((specie) => {
        const query = searchQuery.toLowerCase();
        const commonName = specie.speciesData?.commonName?.toLowerCase() || '';
        const scientificName = specie.speciesData?.scientificName?.toLowerCase() || '';
        const category = specie.speciesData?.category?.toLowerCase() || '';
        return commonName.includes(query) || scientificName.includes(query) || category.includes(query);
    });

    const handleClearSearch = () => {
        const campus = campuses.find(c => c.id?.toString() === selectedCampusId?.toString());
        if (campus) {
            // Navigate back to campus view with campus's default zoom level without reload
            navigate(`/map?campusId=${campus.id}&coordinates=${campus.latitude},${campus.longitude}&zoom=${campus.zoom || 15}`, { replace: true });
        }
        setCurrentSearchedSpecies(null);
    };

    useEffect(() => {
        let swapTimeout: number | undefined;
        let mapTimeout: number | undefined;

        setIsShowMap(false);
        setShowCampusFeather(false);

        // Start transition timers immediately so slow network requests
        // do not block map rendering in production or local development.
        swapTimeout = window.setTimeout(() => {
            setShowCampusFeather(true);
        }, GENERIC_FEATHER_DURATION_MS);
        mapTimeout = window.setTimeout(() => {
            setIsShowMap(true);
        }, GENERIC_FEATHER_DURATION_MS + CAMPUS_FEATHER_PREVIEW_MS);

        const loadData = async () => {
            await getCampuses();
            await getAllCampusSpecies();
        };

        loadData();

        return () => {
            setIsShowMap(false);
            if (swapTimeout) {
                clearTimeout(swapTimeout);
            }
            if (mapTimeout) {
                clearTimeout(mapTimeout);
            }
        }
    }, [getCampuses, getAllCampusSpecies]);

    useEffect(() => {
        // Find the searched species based on coordinates in URL
        if (coordinatesParams && campusSpecies.length > 0) {
            const coords = coordinatesParams.split(',');
            const foundSpecies = campusSpecies.find(
                species => species.latitude === coords[1] && species.longitude === coords[0]
            );
            if (foundSpecies) {
                setCurrentSearchedSpecies(foundSpecies);
            }
        } else {
            setCurrentSearchedSpecies(null);
        }
    }, [coordinatesParams, campusSpecies]);

    return (
        <Fragment>
            {
                speciesModal && (
                    <Modal
                        title={
                            <div className="flex items-center gap-2">
                                {specieHeaderIcon && (
                                    <img
                                        src={specieHeaderIcon}
                                        alt={specie?.speciesData?.category || 'species icon'}
                                        className="w-9 h-9 rounded-full bg-white p-1"
                                    />
                                )}
                                <span>{specie?.speciesData?.commonName}</span>
                            </div>
                        }
                        isOpen={speciesModal}
                        onClose={toggleSpeciesModal}
                        modalContainerClassName="w-full max-w-[95vw] sm:max-w-4xl lg:max-w-5xl"
                        headerClassName="bg-green-50 border-b-2 border-green-600"
                        closeButtonClassName="text-green-700 bg-transparent hover:bg-green-100"
                        bodyClassName="bg-cover bg-center bg-no-repeat"
                        bodyStyle={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.76), rgba(255,255,255,0.76)), url(${ustpBioBackground})` }}
                        titleClass="text-lg sm:text-2xl font-semibold text-gray-900 ml-2 sm:ml-5"
                    >
                        <SpeciesDetails specie={specie?.speciesData ?? undefined} />
                    </Modal>
                )
            }
            {
                searchModal && (
                    <Modal
                        title={
                            <div className="flex items-center gap-2">
                                <FaSearch size={20} className="text-green-700" />
                                <span>Search Species</span>
                            </div>
                        }
                        isOpen={searchModal}
                        onClose={toggleSearchModal}
                        modalContainerClassName="max-w-2xl"
                        headerClassName="bg-green-50 border-b-2 border-green-600"
                        closeButtonClassName="text-green-700 bg-transparent hover:bg-green-100"
                        titleClass="text-2xl font-semibold text-gray-900 ml-5"
                    >
                        <div className="p-4 sm:p-6">
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onKeyPress={handleSearchKeyPress}
                                    placeholder="Search species by name..."
                                    className="input input-bordered w-full text-sm sm:text-base"
                                    autoFocus
                                />
                            </div>
                            <div className="divider my-2">Results</div>
                            <div className="max-h-[50vh] overflow-y-auto">
                                {searchQuery.trim() && filteredSpecies.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {filteredSpecies.map((specie, index) => {
                                            const campusName = campuses.find(c => c.id?.toString() === specie.campus?.toString())?.campus || 'Unknown Campus';
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        const category = specie.speciesData?.category?.toLowerCase();
                                                        const scientificName = encodeURIComponent(specie.speciesData?.scientificName || '');
                                                        window.location.href = `/map?campusId=${specie.campus}&coordinates=${specie.longitude},${specie.latitude}&category=${category}&scientificName=${scientificName}&zoom=20`;
                                                        setSearchQuery("");
                                                        toggleSearchModal();
                                                    }}
                                                    className="p-3 sm:p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="font-medium text-sm sm:text-base">{specie.speciesData?.commonName}</div>
                                                    {specie.speciesData?.scientificName && (
                                                        <div className="text-xs sm:text-sm text-gray-500 italic mt-1">
                                                            {specie.speciesData.scientificName}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col gap-1 mt-2 text-xs text-gray-600">
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-semibold">Campus:</span>
                                                            <span>{campusName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-semibold">Coordinates:</span>
                                                            <span>{specie.latitude}, {specie.longitude}</span>
                                                        </div>
                                                        {specie.speciesData?.category && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-semibold">Category:</span>
                                                                <span className="capitalize">{specie.speciesData.category}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : searchQuery.trim() ? (
                                    <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                                        No species found matching "{searchQuery}"
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm sm:text-base">
                                        Enter a search term to find species
                                    </div>
                                )}
                            </div>
                        </div>
                    </Modal>
                )
            }
            {
                campusModal && (
                    <Modal
                        title={
                            <div className="flex items-center gap-2">
                                <img
                                    src={defaultFeather}
                                    alt="Feather icon"
                                    className="w-10 h-10 rounded-full bg-white p-1"
                                />
                                <span>Select Campus</span>
                            </div>
                        }
                        isOpen={campusModal}
                        onClose={toggleCampusModal}
                        modalContainerClassName="max-w-2xl"
                        headerClassName="bg-green-50 border-b-2 border-green-600"
                        closeButtonClassName="text-green-700 bg-transparent hover:bg-green-100"
                        titleClass="text-2xl font-semibold text-gray-900 ml-5"
                    >
                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                {campuses.map((campus, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleChangeCampus(campus.id?.toString() ?? "")}
                                        className={`p-4 sm:p-5 text-left border-2 rounded-lg transition-all hover:border-green-600 hover:bg-green-50 ${campus.id?.toString() === selectedCampusId?.toString()
                                            ? 'border-green-600 bg-green-50'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <img
                                                src={getCampusFeatherByName(campus.campus)}
                                                alt={`${campus.campus} feather`}
                                                className="w-10 h-10 mt-1 flex-shrink-0 object-contain rounded-full bg-white p-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-base sm:text-lg text-gray-800">
                                                    {campus.campus}
                                                </div>
                                                {campus.address && (
                                                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                                        {campus.address}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Modal>
                )
            }
            {
                mapLayerModal && (
                    <Modal
                        title={
                            <div className="flex items-center gap-2">
                                <FaLayerGroup size={20} className="text-green-700" />
                                <span>Select Map Layer</span>
                            </div>
                        }
                        isOpen={mapLayerModal}
                        onClose={toggleMapLayerModal}
                        modalContainerClassName="max-w-lg"
                        headerClassName="bg-green-50 border-b-2 border-green-600"
                        closeButtonClassName="text-green-700 bg-transparent hover:bg-green-100"
                        titleClass="text-2xl font-semibold text-gray-900 ml-5"
                    >
                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                {[
                                    { id: 'esri', name: 'Esri Satellite', description: 'High-resolution satellite imagery - Free, shows vegetation and land cover' },
                                    { id: 'gbif', name: 'GBIF', description: 'OpenMapTiles style - Best for biodiversity with clear natural features' },
                                    { id: 'satellite', name: 'Satellite', description: 'Satellite imagery with labels - Shows actual vegetation' },
                                    { id: 'outdoor', name: 'Outdoor', description: 'Detailed outdoor map with terrain features' },
                                    { id: 'landscape', name: 'Landscape', description: 'Natural landscape features and terrain' },
                                    { id: 'topo', name: 'Topo', description: 'Topographic map with contour lines' },
                                    { id: 'streets', name: 'Streets', description: 'Street map with roads and labels' },
                                    { id: 'base', name: 'Base', description: 'Simple base map with minimal details' },
                                    { id: 'dataviz', name: 'Dataviz', description: 'High contrast map optimized for data visualization' }
                                ].map((layer) => (
                                    <button
                                        key={layer.id}
                                        onClick={() => handleChangeMapLayer(layer.id)}
                                        className={`p-4 sm:p-5 text-left border-2 rounded-lg transition-all hover:border-green-600 hover:bg-green-50 ${layer.id === selectedMapLayer
                                            ? 'border-green-600 bg-green-50'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <FaLayerGroup
                                                size={24}
                                                className="mt-1 flex-shrink-0"
                                                color={layer.id === selectedMapLayer ? '#16a34a' : '#9ca3af'}
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-base sm:text-lg text-gray-800">
                                                    {layer.name}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                                    {layer.description}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Modal>
                )
            }
            {
                !isShowMap && (
                    <div style={{
                        height: '100vh',
                        width: '100vw',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.82), rgba(255,255,255,0.82)), url(${ustpBioBackground})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}>
                        <div className="transition-content flex flex-col items-center justify-center">
                            <img src={USTPLogo} alt="USTP Logo" className="w-32 h-32 mb-6" />
                            <img src={biodiversityLogo} alt="Biodiversity" className="w-72 sm:w-96 md:w-[30rem] mb-2 object-contain" />
                            <div className="campus-transition-stage mt-6 mb-4" aria-hidden="true">
                                <img
                                    src={showCampusFeather ? getCampusTransitionFeather() : defaultFeather}
                                    alt=""
                                    className={showCampusFeather ? 'campus-feather-reveal' : 'feather-zoom-rotate'}
                                />
                            </div>
                            <div className="text-center mt-4 p-2 max-w-md min-w-[300px]">
                                {selectedCampusData && showCampusFeather ? (
                                    <>
                                        <h2 className="text-4xl sm:text-5xl font-bold leading-tight" style={{ color: getCampusTransitionTextColor() }}>
                                            {selectedCampusData.campus}
                                        </h2>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-lg text-gray-600">
                                            Loading campus information...
                                        </p>
                                        <div className="mt-3 flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
            {
                isShowMap && (
                    <div className="flex flex-1 flex-col md:flex-row overflow-x-hidden">
                        <div className="w-full h-screen flex">
                            <div className="z-20 absolute w-full flex flex-row justify-start">
                                {showPanel && (
                                    <aside className="flex flex-col bg-white h-screen w-full sm:w-80 flex-start items-start border-l-2">
                                        <div className="p-2 flex flex-col h-full justify-start items-center gap-2 overflow-y-auto">
                                            <img src={USTPLogo} alt="USTP Logo" className="w-20 h-20 mt-20" />
                                            <p className="p-2 text-sm text-center">University of Science and Technology of Southern Philippines</p>
                                            <div className="text-justify p-2 text-sm space-y-3">
                                                <p>
                                                    USTP Biodiversity App is a comprehensive digital initiative designed to document, monitor, and celebrate the rich biological diversity found across the University of Science and Technology of Southern Philippines campuses.
                                                </p>
                                                <p>
                                                    This serves as an interactive repository showcasing various species of flora and fauna that inhabit our university grounds. From native trees and vibrant butterflies to diverse bird species and unique insects, each entry provides valuable insights into the ecological wealth of our region.
                                                </p>
                                                <p>This initiative aims to:</p>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>Promote environmental awareness and conservation among students and faculty</li>
                                                    <li>Provide educational resources for research and learning</li>
                                                    <li>Document and preserve knowledge about local biodiversity</li>
                                                    <li>Foster appreciation for our natural heritage</li>
                                                </ul>
                                                <p>
                                                    Explore the interactive maps below to discover the biodiversity of each USTP campus.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-full text-center mb-2 text-xs">
                                            Copyright &copy; {date.getFullYear()} USTP Biodiversity Project
                                        </div>
                                    </aside>
                                )}
                                <div className="flex flex-1 flex-row w-full justify-between items-start py-2 gap-2 px-2">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                        <div className="flex flex-row items-center gap-1 sm:gap-2">
                                            <button className="btn btn-ghost btn-xs sm:btn-sm p-1 sm:p-2 min-h-0 h-8 sm:h-10" onClick={toggleShowPanel}>
                                                <IoMenu size={24} className="sm:w-[30px] sm:h-[30px]" color="white" />
                                            </button>
                                            <button
                                                onClick={handleBackToHome}
                                                className="btn btn-xs sm:btn-sm h-8 sm:h-10 px-2 sm:px-3 gap-1 sm:gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300"
                                                title="Back to Home"
                                            >
                                                <IoHome size={16} className="sm:w-5 sm:h-5" color="green" />
                                                <span className="text-xs sm:text-sm hidden sm:inline">Home</span>
                                            </button>
                                            <button
                                                onClick={toggleSearchModal}
                                                className="btn btn-xs sm:btn-sm h-8 sm:h-10 px-2 sm:px-3 gap-1 sm:gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300"
                                            >
                                                <FaSearch size={14} className="sm:w-4 sm:h-4" color="green" />
                                                <span className="text-xs sm:text-sm">Search</span>
                                            </button>
                                        </div>
                                        {currentSearchedSpecies && (
                                            <div className="bg-white border-2 border-yellow-400 rounded-lg px-3 py-1.5 shadow-md">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-yellow-600 font-bold text-xs sm:text-sm">📍</span>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-xs sm:text-sm text-gray-800">
                                                            {currentSearchedSpecies.speciesData?.commonName}
                                                        </div>
                                                        {currentSearchedSpecies.speciesData?.scientificName && (
                                                            <div className="text-xs text-gray-500 italic hidden sm:block">
                                                                {currentSearchedSpecies.speciesData.scientificName}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={handleClearSearch}
                                                        className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                                                        title="Clear search"
                                                    >
                                                        <IoClose size={16} className="text-gray-600 hover:text-gray-800" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-row gap-2">
                                        <button
                                            onClick={toggleCampusModal}
                                            className="btn btn-xs sm:btn-sm h-8 sm:h-10 px-2 sm:px-3 gap-1 sm:gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300"
                                        >
                                            <BiMapPin size={16} className="sm:w-5 sm:h-5" color="green" />
                                            <span className="text-xs sm:text-sm font-semibold">
                                                {campuses.find(c => c.id?.toString() === selectedCampusId?.toString())?.campus || 'Select'}
                                            </span>
                                        </button>
                                        <button
                                            onClick={toggleMapLayerModal}
                                            className="btn btn-xs sm:btn-sm h-8 sm:h-10 px-2 sm:px-3 gap-1 sm:gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300"
                                        >
                                            <FaLayerGroup size={14} className="sm:w-4 sm:h-4" color="green" />
                                            <span className="text-xs sm:text-sm hidden lg:inline">Map</span>
                                        </button>
                                    </div>

                                </div>
                            </div>

                            <main className="flex flex-1 z-10 overflow-hidden">
                                <MapComponent
                                    campuses={campuses}
                                    campusSpecies={campusSpecies}
                                    handleModal={handleModal}
                                    selectedMapLayer={selectedMapLayer}
                                    campusId={campusId}
                                    coordinatesParams={coordinatesParams}
                                    categoryParam={searchParams.get('category')}
                                    scientificNameParam={searchParams.get('scientificName')}
                                    zoomLevel={Number(searchParams.get('zoom')) !== 0 ? Number(searchParams.get('zoom')) : 40}
                                />
                            </main>

                        </div>
                    </div>
                )
            }

        </Fragment >
    )
}