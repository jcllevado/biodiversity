import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { toast } from "react-toastify";
import { FaArrowLeft, FaEye, FaPen } from "react-icons/fa";
import { ICampus, ICampusSpecies } from "../../core/interfaces/common.interface";
import { supabase } from "../../core/lib/supabase";
import MapComponent from "../../core/components/map";
import Select from "../../core/components/select";
import Modal from "../../core/components/modal";
import SpeciesDetails from "../../core/components/speciesdetails";

const AdminMapPreviewContent = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [campuses, setCampuses] = useState<ICampus[]>([]);
    const [campusSpecies, setCampusSpecies] = useState<ICampusSpecies[]>([]);
    const [selectedCampusId, setSelectedCampusId] = useState<string>("");
    const [selectedSpecie, setSelectedSpecie] = useState<ICampusSpecies | null>(null);
    const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(true);

    const campusOptions = campuses.map((campus) => ({
        value: campus.id?.toString() ?? "",
        text: campus.campus,
    }));

    const selectedCampus = useMemo(
        () => campuses.find((campus) => campus.id?.toString() === selectedCampusId),
        [campuses, selectedCampusId]
    );

    const getCampuses = async () => {
        try {
            const response = await supabase
                .from("campus")
                .select("*")
                .order("campus", { ascending: true })
                .is("deleted_at", null);

            if (response.error) {
                toast.error(response.error.message);
                return;
            }

            const fetchedCampuses = (response.data as ICampus[]) ?? [];
            setCampuses(fetchedCampuses);

            const campusIdFromUrl = searchParams.get("campusId") ?? "";
            const hasCampusFromUrl = fetchedCampuses.some((campus) => campus.id?.toString() === campusIdFromUrl);
            const fallbackCampusId = fetchedCampuses[0]?.id?.toString() ?? "";
            const nextCampusId = hasCampusFromUrl ? campusIdFromUrl : fallbackCampusId;

            setSelectedCampusId(nextCampusId);
            if (nextCampusId) {
                setSearchParams({ campusId: nextCampusId }, { replace: true });
            }
        } catch (error: unknown) {
            toast.error((error as Error).message);
        }
    };

    const getCampusSpecies = async (campusId: string) => {
        try {
            if (!campusId) {
                setCampusSpecies([]);
                return;
            }

            const response = await supabase
                .from("campus_species")
                .select("*, campusData:campus(*), speciesData:species(*)")
                .order("campus", { ascending: true })
                .eq("campus", campusId)
                .is("deleted_at", null);

            if (response.error) {
                toast.error(response.error.message);
                return;
            }

            setCampusSpecies((response.data as ICampusSpecies[]) ?? []);
        } catch (error: unknown) {
            toast.error((error as Error).message);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await getCampuses();
            setLoading(false);
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        if (!selectedCampusId) return;
        getCampusSpecies(selectedCampusId);
    }, [selectedCampusId]);

    const handleCampusChange = (value: string) => {
        setSelectedCampusId(value);
        setSearchParams({ campusId: value }, { replace: true });
    };

    const handleSpeciesModal = (data: ICampusSpecies) => {
        setSelectedSpecie(data);
        setIsSpeciesModalOpen(true);
    };

    const handleUpdateMarkerCoordinate = async (speciesId: string | number, latitude: number, longitude: number) => {
        try {
            const { error } = await supabase
                .from("campus_species")
                .update({ latitude, longitude })
                .eq("id", speciesId);

            if (error) {
                toast.error(error.message);
                return false;
            }

            setCampusSpecies((prev) => prev.map((item) => (
                item.id === speciesId
                    ? { ...item, latitude: latitude.toString(), longitude: longitude.toString() }
                    : item
            )));

            return true;
        } catch (error: unknown) {
            toast.error((error as Error).message);
            return false;
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading map preview...</div>;
    }

    return (
        <Fragment>
            {isSpeciesModalOpen && (
                <Modal
                    title={selectedSpecie?.speciesData?.commonName ?? "Species Details"}
                    isOpen={isSpeciesModalOpen}
                    onClose={() => setIsSpeciesModalOpen(false)}
                    modalContainerClassName="max-w-5xl"
                    titleClass="text-xl font-medium text-gray-900 ml-5"
                >
                    <SpeciesDetails specie={selectedSpecie?.speciesData ?? undefined} />
                </Modal>
            )}

            <div className="w-full h-screen flex flex-col bg-gray-50">
                <div className="flex items-center justify-between p-4 border-b bg-white">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => window.close()}
                        >
                            <FaArrowLeft className="mr-2" /> Close Tab
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900">Preview Campus Species Map</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-56">
                            <Select
                                className="select-sm"
                                value={selectedCampusId}
                                options={campusOptions}
                                onChange={(e) => handleCampusChange(e.target.value)}
                                placeholder="Campus"
                            />
                        </div>
                        <button
                            type="button"
                            className={`btn btn-sm text-white ${isEditMode ? 'btn-warning' : 'btn-info'}`}
                            onClick={() => setIsEditMode((prev) => !prev)}
                        >
                            {isEditMode ? <FaPen className="mr-2" /> : <FaEye className="mr-2" />}
                            {isEditMode ? 'Disable Edit Mode' : 'Enable Edit Mode'}
                        </button>
                    </div>
                </div>

                <div className="flex-1">
                    <MapComponent
                        campuses={selectedCampus ? [selectedCampus] : campuses}
                        campusSpecies={campusSpecies}
                        handleModal={handleSpeciesModal}
                        campusId={selectedCampusId}
                        coordinatesParams={selectedCampus ? `${selectedCampus.longitude},${selectedCampus.latitude}` : null}
                        zoomLevel={Number(selectedCampus?.zoom || 17)}
                        editable={isEditMode}
                        onMarkerCoordinateChange={isEditMode ? handleUpdateMarkerCoordinate : undefined}
                        fitParentHeight
                    />
                </div>
            </div>
        </Fragment>
    );
};

export default function AdminMapPreview() {
    const [auth, setAuth] = useState<Session | null>(null);

    const getUser = async () => {
        const { data, error } = await supabase.auth.getSession();
        if (!error) {
            setAuth(data.session);
        }
    };

    useEffect(() => {
        getUser();
    }, []);

    if (!auth) {
        return <div className="flex h-screen items-center justify-center">Authorizing...</div>;
    }

    return <AdminMapPreviewContent />;
}
