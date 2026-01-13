import { Fragment, useEffect, useState } from "react";
import USTPLogo from '../../../assets/ustp-logo-on-white.png';
import MapComponent from "../../core/components/map";
import { FaExternalLinkAlt } from "react-icons/fa";
import { IoMenu } from "react-icons/io5";
import { FaUserLock } from "react-icons/fa6";
import { BiMapPin } from "react-icons/bi";
import { useSearchParams } from "react-router-dom";
import Modal from "../../core/components/modal";
import SpeciesDetails from "../../core/components/speciesdetails";
import { ICampus, ICampusSpecies } from "../../core/interfaces/common.interface";
import Autocomplete from "../../core/components/autocomplete";
import { supabase } from "../../core/lib/supabase";
import { toast } from "react-toastify";

export default function Landing() {

    const [searchParams] = useSearchParams();
    const campusId = searchParams.get('campusId');
    // const { getCampuses } = useCampusStore();
    // const campuses = useCampusStore(state => state.campuses);
    // const { getCampusSpecies } = useCampusSpeciesStore();
    // const campusSpecies = useCampusSpeciesStore(state => state.campusSpecies);
    const [selectedCampusId, setSelectedCampusId] = useState<string | number | undefined>("");
    const [speciesModal, setSpeciesModal] = useState<boolean>(false);
    const toggleSpeciesModal = () => setSpeciesModal(!speciesModal);
    const [campuses, setCampuses] = useState<ICampus[]>([]);
    const [campusSpecies, setCampusSpecies] = useState<ICampusSpecies[]>([]);
    const [specie, setSpecie] = useState<ICampusSpecies | null>(null);
    const [options, setOptions] = useState<{ value: string; text: string }[] | undefined>([]);
    const [filterdOptions, setFilteredOptions] = useState<{ value: string; text: string }[] | undefined | null>(null);

    const date = new Date();
    const [showPanel, setShowPanel] = useState<boolean>(false);
    // const [showModal, setShowModal] = useState<boolean>(false);
    const [isShowMap, setIsShowMap] = useState<boolean>(false);
    // const toggleShowModal = () => setShowModal(!showModal);
    const toggleShowPanel = () => setShowPanel(!showPanel);
    const [selectedCampusData, setSelectedCampusData] = useState<ICampus | null>(null);

    const setRedirectCampusData = (campusId: string | number | undefined) => {
        if (!campusId) {
            const campusData = campuses.find(campus => campus.id?.toString() === campusId?.toString());
            if (campusData) {
                setSelectedCampusData(campusData);
            }
        }
    };

    const initCampus = () => {
        if (campusId) {
            setSelectedCampusId(campusId);
            setRedirectCampusData(campusId);
        } else {
            setSelectedCampusId(campuses[0]?.id);
            setRedirectCampusData(campuses[0]?.id);
        }
    }


    const getCampuses = async () => {
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

            setCampuses(() => response.data as ICampus[]);
            if (campusId) {
                fetchSpecies(campusId);
            } else {
                fetchSpecies(response.data[0]?.id);
            }
        } catch (error: unknown) {
            toast.error((error as Error).message);
            return null;
        }
    }

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

    const fetchSpecies = async (campusId: string) => {
        const campusSpeciesData = await getCampusSpecies(campusId) ?? [];
        setCampusSpecies(campusSpeciesData);
        const result = campusSpeciesData.map((specie) => {
            if (specie.id) {
                return { value: (specie?.id ?? '').toString(), text: specie.speciesData?.commonName ?? "" };
            }
            return undefined;
        }).filter((item): item is { value: string; text: string } => item !== undefined);

        if (result.length > 0) {
            setOptions(result);
        }
    }


    const handleModal = (data: ICampusSpecies) => {
        setSpecie(data);
        toggleSpeciesModal();
    }

    const handleChangeCampus = (value: string) => {
        const campusData = campuses.find(campus => campus.id?.toString() === value.toString());
        if (campusData) {
            window.location.href = `?campusId=${campusData.id}&coordinates=${campusData.latitude},${campusData.longitude}&zoom=${campusData.zoom}`;
        }
    }

    const handleChangeAutocomplete = (value: string) => {
        if (value === "") {
            setFilteredOptions(null);
            return;
        }
        const filteredOptions = options?.filter((item) => {
            return item.text.toLowerCase().includes(value.toLowerCase());
        });
        setFilteredOptions(filteredOptions);
    }

    const handleSelectedValue = (value: string) => {
        const selectedCampusSpecie = campusSpecies.find((specie) => specie.id?.toString() === value);
        if (selectedCampusSpecie) {
            window.location.href = `?campusId=${selectedCampusSpecie.campus}&coordinates=${selectedCampusSpecie.longitude},${selectedCampusSpecie.latitude}`;
        }
    }

    const getData = async () => {
        await getCampuses();
        initCampus();
        setTimeout(() => {
            setIsShowMap(true);
        }, 3000);
    }


    useEffect(() => {
        getData();
    }, []);

    return (
        <Fragment>
            {
                speciesModal && (
                    <Modal title={`${specie?.speciesData?.commonName}`} isOpen={speciesModal} onClose={toggleSpeciesModal} modalContainerClassName="max-w-5xl" titleClass="text-xl font-medium text-gray-900 ml-5">
                        <SpeciesDetails specie={specie?.speciesData ?? undefined} />
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
                        backgroundColor: 'white'
                    }}>
                        <div className="text-lg">
                            {selectedCampusData?.campus}
                        </div>
                    </div>
                )
            }
            {
                isShowMap && (
                    <div className="flex flex-1 flex-row overflow-x-hidden">
                        <div className="w-full h-screen flex">
                            <div className="z-20 absolute w-full flex flex-row justify-start">
                                {showPanel && (
                                    <aside className="flex flex-col bg-white h-screen w-80 flex-start items-start border-l-2">
                                        <div className="p-2 flex flex-col h-full justify-start items-center gap-2">
                                            <img src={USTPLogo} alt="USTP Logo" className="w-20 h-20 mt-20" />
                                            <p className="p-2 text-sm text-center">University of Science and Technology of Southern Philippines</p>
                                            <p className="text-justify p-2 text-sm">
                                                The USTP Biodiversity web application showcases a rich collection of specimens and exhibits dedicated to the study and conservation of biodiversity. It features detailed descriptions of various species, interactive exhibits, and educational resources that highlight the importance of preserving our natural heritage.
                                            </p>
                                        </div>
                                        <div className="flex flex-row items-center w-full px-2 pr-6 text-sm justify-center mb-2">
                                            Links:
                                            <a href="/admin" className="flex items-center text-blue-600 text-sm" target="_blank" rel="noopener noreferrer">
                                                <FaUserLock size={12} className="m-2" />
                                                Admin
                                            </a>
                                            <a href="https://ustp.edu.ph/" className="flex items-center text-blue-600 text-sm" target="_blank" rel="noopener noreferrer">
                                                <FaExternalLinkAlt size={12} className="m-2" />
                                                USTP Website
                                            </a>
                                        </div>
                                        <div className="w-full text-center mb-2 text-xs">
                                            Copyright &copy; {date.getFullYear()} USTP Biodiversity Project
                                        </div>
                                    </aside>
                                )}
                                <div className="flex flex-1 flex-row w-full justify-between py-2">
                                    <div className="flex flex-1 flex-row">
                                        <button className="btn btn-ghost btn-sm mt-2 ml-2" onClick={toggleShowPanel}>
                                            <IoMenu size={30} color="white" />
                                        </button>
                                        <div className="flex flex-1 flex-col opacity-80">
                                            <div className="input input-bordered input-md w-[500px] ml-2 flex flex-row items-center">
                                                <Autocomplete
                                                    placeholder="Search species in this campus"
                                                    options={filterdOptions ?? options}
                                                    onChange={(value) => handleChangeAutocomplete(value)}
                                                    setSelectedValue={(value) => handleSelectedValue(value)}
                                                />
                                            </div>
                                        </div>

                                    </div>
                                    <div className="flex h-12 flex-row pr-2">
                                        <div className="flex flex-row items-center bg-white px-2 rounded-lg opacity-80">
                                            <BiMapPin color="red" size={20} className="ml-2" />
                                            <span className="mx-2">CAMPUS</span>
                                            <select value={selectedCampusId} className="select select-md min-w-64 !focus:border-none" onChange={(e) => handleChangeCampus(e.target.value)}>
                                                <option value="0" disabled>USTP Campuses</option>
                                                {campuses.map((campus, index) => {
                                                    return (
                                                        <option key={index} value={campus.id}>{campus.campus}</option>
                                                    )
                                                })}
                                            </select>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <main className="flex flex-1 z-10 overflow-hidden">
                                <MapComponent
                                    campuses={campuses}
                                    campusSpecies={campusSpecies}
                                    handleModal={handleModal}
                                />
                            </main>

                        </div>
                    </div>
                )
            }

        </Fragment >
    )
}