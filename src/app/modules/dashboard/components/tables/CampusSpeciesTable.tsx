import DataTable, { TableColumn } from "react-data-table-component";
import { IActions, ICampusSpecies } from "../../../../core/interfaces/common.interface";
import { FaArchive, FaCheckCircle, FaCog, FaFileCsv, FaMapMarkerAlt, FaPlusCircle, FaRegEdit, FaTrashRestore, FaUniversity, FaUpload } from "react-icons/fa";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useCampusStore } from "../../../../core/zustand/campus";
import Loader from "../../../../core/components/loader";
import Modal from "../../../../core/components/modal";
import { FaFileExport, FaMapLocation } from "react-icons/fa6";
import ActionDropdown from "../../../../core/components/actiondropdown";
import Select from "../../../../core/components/select";
import { useSpeciesStore } from "../../../../core/zustand/species";
import TextField from "../../../../core/components/textfield";
import LoadingButton from "../../../../core/components/loadingbutton";
import { Form, FormikProvider, useFormik } from "formik";
import { campusSpeciesSchema } from "../../../../core/schema/campus-species.schema";
import { TfiTarget } from "react-icons/tfi";
import Tooltip from "../../../../core/components/tooltip";
import { TbDatabaseSearch } from "react-icons/tb";
import Autocomplete from "../../../../core/components/autocomplete";
import MapModalComponent from "../../../../core/components/mapmodal";
import { toast } from "react-toastify";
import { useCampusSpeciesStore } from "../../../../core/zustand/campus-species";
import Species from "../../../../core/components/speciesdetails";
import { supabase } from "../../../../core/lib/supabase";
import * as XLSX from "xlsx";


const CampusSpeciesTable = () => {

    const TEMPLATE_SIGNATURE = 'biodiversity campus species template';

    const { getCampuses } = useCampusStore();
    const { getSpecies, getSpeciesByCategory, searchSpeciesByCategory, getSpecie } = useSpeciesStore();
    const { getCampusSpecies, createCampusSpecie, editCampusSpecie, deleteCampusSpecie, restoreCampusSpecie, setCampusSpecies } = useCampusSpeciesStore();
    const processing = useCampusStore(state => state.processing);
    const categories = useSpeciesStore(state => state.categories);
    const campuses = useCampusStore(state => state.campuses);
    const campusSpecies = useCampusSpeciesStore(state => state.campusSpecies);
    const campusSpeciesProcessing = useCampusSpeciesStore(state => state.processing);
    const specie = useSpeciesStore(state => state.specie);
    const specieProcessing = useSpeciesStore(state => state.processing);

    const campusOptions = campuses.map(campus => ({ value: campus.id ?? '', text: campus.campus }));
    const speciesByCategory = useSpeciesStore(state => state.speciesByCategory);

    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [mapModal, setMapModal] = useState<boolean>(false);
    const toggleMapModal = () => setMapModal(!mapModal);
    const [speciesModal, setSpeciesModal] = useState<boolean>(false);
    const toggleSpeciesModal = () => setSpeciesModal(!speciesModal);
    const [initialAutocompleteText, setInitialAutocompleteText] = useState<string>('');
    const [action, setAction] = useState<string>('add');
    const [isIncludeArchived, setIsIncludeArchived] = useState<boolean>(false);
    const [sortedCampus, setSortedCampus] = useState<string | null>(null);
    const [exportModal, setExportModal] = useState<boolean>(false);
    const [downloadTemplateModal, setDownloadTemplateModal] = useState<boolean>(false);
    const [uploadTemplateModal, setUploadTemplateModal] = useState<boolean>(false);
    const [templateCampus, setTemplateCampus] = useState<string>('');
    const [templateScope, setTemplateScope] = useState<'all' | 'category'>('all');
    const [templateAction, setTemplateAction] = useState<'insert' | 'update'>('insert');
    const [templateCategory, setTemplateCategory] = useState<string>('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploadingTemplate, setIsUploadingTemplate] = useState<boolean>(false);
    const uploadFileInputRef = useRef<HTMLInputElement>(null);
    const [exportScope, setExportScope] = useState<'current' | 'all' | string>('current');
    const [selectedExportFields, setSelectedExportFields] = useState<string[]>([
        'campus',
        'speciesCommonName',
        'speciesScientificName',
        'category',
        'latitude',
        'longitude',
    ]);

    const exportFieldOptions = [
        { value: 'campus', label: 'Campus' },
        { value: 'campusId', label: 'Campus ID' },
        { value: 'speciesCommonName', label: 'Species Common Name' },
        { value: 'speciesScientificName', label: 'Species Scientific Name' },
        { value: 'category', label: 'Category' },
        { value: 'latitude', label: 'Latitude' },
        { value: 'longitude', label: 'Longitude' },
        { value: 'archived', label: 'Archived' },
        { value: 'createdAt', label: 'Created At' },
        { value: 'updatedAt', label: 'Updated At' },
    ];

    const getData = useCallback(async (isIncludeArchived = false) => {
        getCampuses(isIncludeArchived);
        getSpecies(isIncludeArchived);
        getCampusSpecies(isIncludeArchived, sortedCampus);
    }, [getCampuses, getCampusSpecies, getSpecies, sortedCampus]);

    useEffect(() => {
        const fetchData = async () => {
            getData();
        };
        fetchData();
    }, [getData])

    const handleMapLocation = () => {
        if (formik.values.campus === '') {
            toast.info('Please select a campus first');
            return;
        }
        toggleMapModal();
    }

    const handlePreviewCampusSpecies = () => {
        const fallbackCampus = campuses[0]?.id?.toString() ?? '';
        const campusToPreview = (sortedCampus ?? '') || fallbackCampus;

        if (!campusToPreview) {
            toast.info('No campus available to preview yet.');
            return;
        }

        window.open(`/admin/map-preview?campusId=${campusToPreview}`, '_blank', 'noopener,noreferrer');
    }

    const handleGetSpeciesByCategory = (category: string) => {
        setSelectedCategory(category);
        getSpeciesByCategory(category);
    }

    const handleSelectedSpecies = (species: string) => {
        formik.setFieldValue('species', species);
    }

    const handleChangeAutocomplete = (value: string) => {
        searchSpeciesByCategory(selectedCategory, value);
    }

    const handleLongLat = (coordinates: number[]) => {
        formik.setFieldValue('latitude', coordinates[0].toString());
        formik.setFieldValue('longitude', coordinates[1].toString());
    }

    const handleSelectedSpeciesDetails = () => {
        if (formik.values.species === '') {
            toast.info('Please select a species first');
            return;
        }

        getSpecie(formik.values.species);
        toggleSpeciesModal();
    }

    const handleClearForm = () => {
        setAction('add');
        setSelectedCategory('');
        setInitialAutocompleteText('');
        formik.resetForm();
    }

    const handleFilterByCampus = (campus: string) => {
        setSortedCampus(campus);
        getCampusSpecies(isIncludeArchived, campus);
    }

    const handleFilterByCategory = (category: string) => {
        const filteredSpecies = campusSpecies.filter(species => species.speciesData?.category === category);
        setCampusSpecies(filteredSpecies);
    }

    const toggleExportModal = () => setExportModal(!exportModal);
    const toggleDownloadTemplateModal = () => setDownloadTemplateModal(!downloadTemplateModal);
    const toggleUploadTemplateModal = () => setUploadTemplateModal(!uploadTemplateModal);

    const handleUploadFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setUploadFile(file);
    };

    const handleClearUploadFile = () => {
        setUploadFile(null);
        if (uploadFileInputRef.current) {
            uploadFileInputRef.current.value = '';
        }
    };

    const handleToggleExportField = (field: string) => {
        setSelectedExportFields(prev =>
            prev.includes(field)
                ? prev.filter(value => value !== field)
                : [...prev, field]
        );
    };

    const getCampusOptionsForExport = () => {
        const options = campuses.map((campus) => ({
            value: campus.id?.toString() ?? '',
            label: campus.campus,
        }));

        const currentCampusName = campuses.find((campus) => campus.id?.toString() === sortedCampus?.toString())?.campus;

        return [
            ...(currentCampusName ? [{ value: sortedCampus?.toString() ?? '', label: currentCampusName }] : []),
            ...options,
            { value: 'all', label: 'All campuses' },
        ];
    };

    const parseTemplateFile = async (file: File): Promise<unknown[][]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    if (file.name.toLowerCase().endsWith('.csv')) {
                        const content = event.target?.result as string;
                        const rows = content
                            .split(/\r?\n/)
                            .filter((line) => line.trim() !== '')
                            .map((line) => {
                                const values: string[] = [];
                                let currentValue = '';
                                let insideQuotes = false;

                                for (let i = 0; i < line.length; i += 1) {
                                    const char = line[i];
                                    if (char === '"') {
                                        if (insideQuotes && line[i + 1] === '"') {
                                            currentValue += '"';
                                            i += 1;
                                        } else {
                                            insideQuotes = !insideQuotes;
                                        }
                                    } else if (char === ',' && !insideQuotes) {
                                        values.push(currentValue);
                                        currentValue = '';
                                    } else {
                                        currentValue += char;
                                    }
                                }

                                values.push(currentValue);
                                return values;
                            });

                        resolve(rows);
                        return;
                    }

                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
                    resolve(rows);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read the selected file.'));

            if (file.name.toLowerCase().endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    };

    const handleUploadCampusSpeciesTemplate = async () => {
        const campusIdToUse = templateCampus || sortedCampus;

        if (!campusIdToUse) {
            toast.info('Please select a campus for the upload first.');
            return;
        }

        if (!uploadFile) {
            toast.info('Please select a CSV template file to upload.');
            return;
        }

        setIsUploadingTemplate(true);

        try {
            const rows = await parseTemplateFile(uploadFile);
            const normalizedRows = rows
                .map((row) => (Array.isArray(row) ? row.map((value) => String(value ?? '').trim()) : []))
                .filter((row) => row.some((value) => value !== ''));
            const hasTemplateSignature = normalizedRows.some((row) => row.some((value) => value.toLowerCase().includes(TEMPLATE_SIGNATURE)));

            if (!hasTemplateSignature) {
                toast.error('Only files generated from the campus species template can be uploaded.');
                return;
            }

            const expectedHeaders = templateAction === 'update'
                ? ['species_common_name', 'campus_species_id', 'longitude', 'latitude']
                : ['species_common_name', 'species_id', 'longitude', 'latitude'];
            const expectedTemplateType = templateAction === 'update' ? 'bulk update' : 'bulk insert';
            const hasCorrectTemplateType = templateAction === 'update'
                ? normalizedRows.some((row) => row.some((value) => value.toLowerCase().includes('campus species id')))
                : normalizedRows.some((row) => row.some((value) => value.toLowerCase().includes('species id')));

            if (!hasCorrectTemplateType) {
                toast.error(`The selected file is not a ${expectedTemplateType} template.`);
                return;
            }
            const headerIndex = normalizedRows.findIndex((row) => row[0]?.toLowerCase() === expectedHeaders[0] && row[1]?.toLowerCase() === expectedHeaders[1] && row[2]?.toLowerCase() === expectedHeaders[2] && row[3]?.toLowerCase() === expectedHeaders[3]);

            if (headerIndex === -1) {
                toast.error('The selected file does not match the expected campus species template headers.');
                return;
            }

            const dataRows = normalizedRows.slice(headerIndex + 1).filter((row) => row.some((value) => value !== ''));
            const invalidRows: string[] = [];
            const insertPayload: Array<{ campus: string; species: string; longitude: number | null; latitude: number | null }> = [];
            let updatedCount = 0;
            let insertedCount = 0;
            let notifiedFallback = false;

            for (const row of dataRows) {
                const identifier = row[1] ?? '';
                const rawLongitude = row[2] ?? '';
                const rawLatitude = row[3] ?? '';
                const longitudeValue = rawLongitude === '' ? null : Number(rawLongitude);
                const latitudeValue = rawLatitude === '' ? null : Number(rawLatitude);

                if (!identifier || (rawLongitude !== '' && Number.isNaN(longitudeValue)) || (rawLatitude !== '' && Number.isNaN(latitudeValue))) {
                    invalidRows.push(`Row ${dataRows.indexOf(row) + 2}`);
                    continue;
                }

                if (templateAction === 'insert') {
                    const { data: speciesRecord, error: speciesError } = await supabase
                        .from('species')
                        .select('id')
                        .eq('id', identifier)
                        .maybeSingle();

                    if (speciesError || !speciesRecord) {
                        invalidRows.push(`Row ${dataRows.indexOf(row) + 2}`);
                        continue;
                    }

                    insertPayload.push({
                        campus: campusIdToUse,
                        species: identifier,
                        longitude: longitudeValue,
                        latitude: latitudeValue,
                    });
                    insertedCount += 1;
                    continue;
                }

                const { data: campusSpeciesRecord, error: campusSpeciesError } = await supabase
                    .from('campus_species')
                    .select('id')
                    .eq('campus', campusIdToUse)
                    .eq('id', identifier)
                    .maybeSingle();

                if (campusSpeciesError) {
                    invalidRows.push(`Row ${dataRows.indexOf(row) + 2}`);
                    continue;
                }

                if (!campusSpeciesRecord) {
                    if (!notifiedFallback) {
                        toast.warning('The uploaded campus species ID was not found. Creating a new campus species entry instead.');
                        notifiedFallback = true;
                    }
                    insertPayload.push({
                        campus: campusIdToUse,
                        species: identifier,
                        longitude: longitudeValue,
                        latitude: latitudeValue,
                    });
                    insertedCount += 1;
                    continue;
                }

                const { error } = await supabase
                    .from('campus_species')
                    .update({ longitude: longitudeValue, latitude: latitudeValue })
                    .eq('id', campusSpeciesRecord.id);

                if (error) {
                    invalidRows.push(`Row ${dataRows.indexOf(row) + 2}`);
                } else {
                    updatedCount += 1;
                }
            }

            if (insertPayload.length === 0 && updatedCount === 0) {
                toast.info('No valid campus species rows were found in the uploaded file.');
                return;
            }

            if (insertPayload.length > 0) {
                const { error } = await supabase.from('campus_species').insert(insertPayload);
                if (error) {
                    toast.error(error.message);
                    return;
                }
            }

            if (invalidRows.length > 0) {
                toast.warning(`Uploaded with ${invalidRows.length} invalid rows skipped.`);
            }

            toast.success(templateAction === 'insert'
                ? `Inserted ${insertedCount} campus species rows successfully.`
                : `Updated ${updatedCount} campus species rows${insertedCount > 0 ? ` and inserted ${insertedCount} new ones` : ''} successfully.`);
            await getCampusSpecies(false, campusIdToUse);
            handleClearUploadFile();
            setUploadTemplateModal(false);
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsUploadingTemplate(false);
        }
    };

    const handleDownloadCampusSpeciesTemplate = async () => {
        const isUpdateAction = templateAction === 'update';

        if (isUpdateAction && !templateCampus) {
            toast.info('Please select a campus for the bulk update template.');
            return;
        }

        let rowsToExport: Array<{ id?: string | number; species?: string | number; commonName?: string; category?: string; longitude?: number | string; latitude?: number | string; speciesData?: { commonName?: string; category?: string } }> = [];

        if (isUpdateAction) {
            const campusSpeciesQuery = supabase
                .from('campus_species')
                .select('id, species, longitude, latitude, speciesData:species(commonName, category)')
                .eq('campus', templateCampus)
                .order('id', { ascending: true });

            const { data: campusSpeciesData, error: campusSpeciesError } = await campusSpeciesQuery;

            if (campusSpeciesError) {
                toast.error(campusSpeciesError.message);
                return;
            }

            rowsToExport = (campusSpeciesData as Array<{ id?: string | number; species?: string | number; longitude?: number | string; latitude?: number | string; speciesData?: { commonName?: string; category?: string } }> | null) ?? [];
        } else {
            let query = supabase
                .from('species')
                .select('id, commonName, category')
                .order('commonName', { ascending: true });

            if (!isIncludeArchived) {
                query = query.is('deleted_at', null);
            }

            if (templateScope === 'category') {
                if (!templateCategory) {
                    toast.info('Please select a category for the template.');
                    return;
                }
                query = query.ilike('category', templateCategory);
            }

            const { data, error } = await query;
            if (error) {
                toast.error(error.message);
                return;
            }

            rowsToExport = (data as Array<{ id?: string | number; commonName?: string; category?: string }> | null) ?? [];
        }


        if (isUpdateAction && templateScope === 'category') {
            rowsToExport = rowsToExport.filter((row) => {
                const rowCategory = (row as { speciesData?: { category?: string } }).speciesData?.category;
                return !templateCategory || rowCategory === templateCategory;
            });
        }

        if (rowsToExport.length === 0) {
            toast.info(isUpdateAction ? 'No mapped campus species found for the selected campus.' : 'No species found for the selected template scope.');
            return;
        }

        const instructionRows = isUpdateAction
            ? [
                ['Biodiversity Campus Species Template'],
                ['Generated by Biodiversity'],
                ['Template Instructions'],
                ['Do not edit the Campus Species ID column.'],
                ['Insert the correct longitude and latitude.'],
                [],
            ]
            : [
                ['Biodiversity Campus Species Template'],
                ['Generated by Biodiversity'],
                ['Template Instructions'],
                ['Do not edit the Species ID column.'],
                ['In cases where multiple locations of the same species. Insert a new row, with same species name and id.'],
                ['Insert the correct longitude and latitude per.'],
                [],
            ];
        const headers = [
            'species_common_name',
            'category',
            isUpdateAction ? 'campus_species_id' : 'species_id',
            'longitude',
            'latitude',
        ];
        const csvRows = rowsToExport.map((row) => [
            isUpdateAction ? (row.speciesData?.commonName ?? '') : row.commonName ?? '',
            isUpdateAction ? (row.speciesData?.category ?? '') : row.category ?? '',
            isUpdateAction ? row.id ?? '' : row.id ?? '',
            isUpdateAction ? row.longitude ?? '' : '',
            isUpdateAction ? row.latitude ?? '' : '',
        ]);

        const csvContent = [
            ...instructionRows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')),
            headers.join(','),
            ...csvRows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')),
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${isUpdateAction ? `${(campuses.find((campus) => campus.id?.toString() === templateCampus?.toString())?.campus ?? 'selected-campus').toLowerCase().replace(/\s+/g, '-')}-` : ''}species-template-${templateAction}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);

        toast.success('CSV template downloaded successfully.');
        setDownloadTemplateModal(false);
    };

    const handleExportCampusSpecies = async () => {
        if (selectedExportFields.length === 0) {
            toast.info('Please select at least one field to export.');
            return;
        }

        let rowsToExport: ICampusSpecies[] = campusSpecies;

        if (exportScope === 'all') {
            let query = supabase
                .from('campus_species')
                .select('*, campusData:campus(*), speciesData:species(*)')
                .order('campus', { ascending: true });

            if (!isIncludeArchived) {
                query = query.is('deleted_at', null);
            }

            const { data, error } = await query;
            if (error) {
                toast.error(error.message);
                return;
            }

            rowsToExport = data as ICampusSpecies[];
        } else {
            const selectedCampusId = exportScope;
            let query = supabase
                .from('campus_species')
                .select('*, campusData:campus(*), speciesData:species(*)')
                .order('campus', { ascending: true })
                .eq('campus', selectedCampusId);

            if (!isIncludeArchived) {
                query = query.is('deleted_at', null);
            }

            const { data, error } = await query;
            if (error) {
                toast.error(error.message);
                return;
            }

            rowsToExport = data as ICampusSpecies[];
        }

        if (rowsToExport.length === 0) {
            toast.info('No campus species data available to export.');
            return;
        }

        const rows = rowsToExport.map((row) => {
            const values: Record<string, string | number | boolean> = {};

            selectedExportFields.forEach((field) => {
                switch (field) {
                    case 'campus':
                        values[field] = row.campusData?.campus ?? row.campus ?? '';
                        break;
                    case 'campusId':
                        values[field] = row.campus ?? '';
                        break;
                    case 'speciesCommonName':
                        values[field] = row.speciesData?.commonName ?? '';
                        break;
                    case 'speciesScientificName':
                        values[field] = row.speciesData?.scientificName ?? '';
                        break;
                    case 'category':
                        values[field] = row.speciesData?.category ?? '';
                        break;
                    case 'latitude':
                        values[field] = row.latitude ?? '';
                        break;
                    case 'longitude':
                        values[field] = row.longitude ?? '';
                        break;
                    case 'archived':
                        values[field] = row.deleted_at !== null;
                        break;
                    case 'createdAt':
                        values[field] = row.created_at ?? '';
                        break;
                    case 'updatedAt':
                        values[field] = row.updated_at ?? '';
                        break;
                    default:
                        values[field] = '';
                }
            });

            return values;
        });

        const headers = selectedExportFields.map((field) => exportFieldOptions.find(option => option.value === field)?.label ?? field);
        const data = [headers, ...rows.map((row) => selectedExportFields.map((field) => row[field] ?? ''))];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Campus Species');
        XLSX.writeFile(workbook, `${exportScope === 'all' ? 'all-campus' : 'campus'}-species-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success('Campus species export downloaded successfully.');
        setExportModal(false);
    };

    useEffect(() => {
        getData(isIncludeArchived);
    }, [getData, isIncludeArchived])


    const formik = useFormik({
        initialValues: {
            campus: '',
            species: '',
            longitude: '',
            latitude: '',
        },
        validationSchema: campusSpeciesSchema,
        onSubmit: async (values) => {
            if (action === 'edit') {
                editCampusSpecie(values);
            } else {
                createCampusSpecie(values);
                formik.setFieldValue('longitude', '');
                formik.setFieldValue('latitude', '');
                formik.setFieldValue('species', '');
            }
        }
    })


    const commonSetting = {};

    const getActionEvents = (species: ICampusSpecies): IActions<ICampusSpecies>[] => {
        // check if allowed to edit with stepper     
        const actions: IActions<ICampusSpecies>[] = [
            {
                name: "View",
                event: (data: ICampusSpecies) => {
                    window.open(`/?campusId=${data.campus}&coordinates=${data.longitude},${data.latitude}`, '_blank');
                },
                icon: <FaMapMarkerAlt className="text-red-500" />,
                color: "primary",
            },
            {
                name: "Edit",
                event: (data: ICampusSpecies) => {
                    const dataToEdit = {
                        id: data.id,
                        campus: data.campus,
                        species: data.species,
                        latitude: data.latitude as string,
                        longitude: data.longitude as string,
                    }

                    setSelectedCategory(data.speciesData?.category ?? '');
                    setInitialAutocompleteText(data.speciesData?.commonName ?? '');
                    setAction('edit');
                    formik.setValues(dataToEdit);
                },
                icon: <FaRegEdit className="text-blue-500" />,
                color: "primary",
            },
            ...(species.deleted_at === null ? [
                {
                    name: "Archive",
                    event: (data: ICampusSpecies) => {
                        deleteCampusSpecie(data)
                    },
                    icon: <FaArchive className="text-red-500" />,
                    color: "danger",
                }
            ] : []),
            ...(species.deleted_at !== null ? [
                {
                    name: "Restore",
                    event: (data: ICampusSpecies) => {
                        restoreCampusSpecie(data)
                    },
                    icon: <FaTrashRestore className="text-info" />,
                    color: "info",
                }
            ] : []),
        ];

        return actions;
    };

    const columns: TableColumn<ICampusSpecies>[] = [
        {
            name: <span className="flex flex-row"><FaUniversity className="mr-2" /> Campus</span>,
            cell: (row) => <div>{row.campusData?.campus}</div>,
            ...commonSetting,
        },
        {
            name: <span className="flex flex-row"><FaMapMarkerAlt className="mr-2" /> Species</span>,
            cell: (row) => <div>{row.deleted_at !== null ? <span className="text-red-500">(Archived) </span> : ""}{row.speciesData?.commonName}</div>,
            ...commonSetting,
        },
        {
            name: <span className="flex flex-row"><FaMapLocation className="mr-2" /> Coordinates</span>,
            cell: (row) => `Lat: ${row.latitude}, Lng: ${row.longitude}`,
            ...commonSetting,
        },
        {
            name: <span className="flex flex-1 justify-center"><FaCog className="mr-2" />Actions</span>,
            cell: (row, index) => {
                return <div className="flex flex-1 justify-center">
                    <ActionDropdown<ICampusSpecies>
                        actions={getActionEvents(row)}
                        rowIndex={index}
                        data={row}
                    />
                </div>

            }
        }
    ];

    return <Fragment>
        {
            mapModal && (
                <Modal
                    title="Map"
                    isOpen={mapModal}
                    onClose={toggleMapModal}
                    modalContainerClassName="max-w-7xl"
                >
                    <MapModalComponent
                        campuses={campuses}
                        initialCampus={formik.values.campus}
                        initialCoordinates={[Number(formik.values.latitude), Number(formik.values.longitude)]}
                        getLongLat={handleLongLat}
                    />
                    <div className="flex flex-1 flex-col justify-end items-end">
                        <button onClick={toggleMapModal} className="btn btn-success text-white w-44">Apply</button>
                    </div>
                </Modal>
            )
        }

        {
            speciesModal && (
                <Modal title={`${specie?.commonName}`} isOpen={speciesModal} onClose={toggleSpeciesModal} modalContainerClassName="max-w-5xl" titleClass="text-xl font-medium text-gray-900 ml-5">
                    <Species specie={specie ?? undefined} />
                </Modal>
            )
        }

        {
            downloadTemplateModal && (
                <Modal title="Download CSV Template" isOpen={downloadTemplateModal} onClose={toggleDownloadTemplateModal} modalContainerClassName="max-w-xl">
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-600 mt-2">
                            Choose whether to build a bulk insert template for species or a bulk update template for existing campus mappings.
                        </p>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-700">Template action</span>
                            <select
                                value={templateAction}
                                onChange={(e) => setTemplateAction(e.target.value as 'insert' | 'update')}
                                className="select select-sm w-full border border-gray-300 rounded-lg"
                            >
                                <option value="insert">Bulk Insert</option>
                                <option value="update">Bulk Update</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-700">Campus</span>
                            <Select
                                placeholder="Select campus"
                                className="select-sm"
                                value={templateCampus}
                                options={campusOptions}
                                onChange={(e) => setTemplateCampus(e.target.value)}
                            />
                        </div>
                        {templateAction === 'update' && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm font-medium text-gray-700">Template scope</span>
                                    <select
                                        value={templateScope}
                                        onChange={(e) => setTemplateScope(e.target.value as 'all' | 'category')}
                                        className="select select-sm w-full border border-gray-300 rounded-lg"
                                    >
                                        <option value="all">All species</option>
                                        <option value="category">Specific category</option>
                                    </select>
                                </div>
                                {templateScope === 'category' && (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm font-medium text-gray-700">Category</span>
                                        <Select
                                            placeholder="Select category"
                                            className="select-sm"
                                            value={templateCategory}
                                            options={categories}
                                            onChange={(e) => setTemplateCategory(e.target.value)}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                        {templateAction === 'insert' && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm font-medium text-gray-700">Template scope</span>
                                    <select
                                        value={templateScope}
                                        onChange={(e) => setTemplateScope(e.target.value as 'all' | 'category')}
                                        className="select select-sm w-full border border-gray-300 rounded-lg"
                                    >
                                        <option value="all">All species</option>
                                        <option value="category">Specific category</option>
                                    </select>
                                </div>
                                {templateScope === 'category' && (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm font-medium text-gray-700">Category</span>
                                        <Select
                                            placeholder="Select category"
                                            className="select-sm"
                                            value={templateCategory}
                                            options={categories}
                                            onChange={(e) => setTemplateCategory(e.target.value)}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={toggleDownloadTemplateModal} className="btn btn-sm btn-ghost">Cancel</button>
                            <button type="button" onClick={handleDownloadCampusSpeciesTemplate} className="btn btn-sm btn-info text-white">
                                <FaFileCsv className="mr-2" /> Download Template
                            </button>
                        </div>
                    </div>
                </Modal>
            )
        }

        {
            uploadTemplateModal && (
                <Modal title="Upload Species" isOpen={uploadTemplateModal} onClose={toggleUploadTemplateModal} modalContainerClassName="max-w-xl">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-700 mt-4">Campus</span>
                            <Select
                                placeholder="Select campus"
                                className="select-sm"
                                value={templateCampus}
                                options={campusOptions}
                                onChange={(e) => setTemplateCampus(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-700">Template action</span>
                            <select
                                value={templateAction}
                                onChange={(e) => setTemplateAction(e.target.value as 'insert' | 'update')}
                                className="select select-sm w-full border border-gray-300 rounded-lg"
                            >
                                <option value="insert">Bulk Insert</option>
                                <option value="update">Bulk Update</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-700">Upload completed template</span>
                            <input
                                ref={uploadFileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleUploadFileChange}
                                className="file-input file-input-bordered file-input-sm w-full"
                            />
                            {uploadFile && (
                                <div className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                    <span>{uploadFile.name}</span>
                                    <button type="button" onClick={handleClearUploadFile} className="text-red-500">Remove</button>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={toggleUploadTemplateModal} className="btn btn-sm btn-ghost">Cancel</button>
                            <button type="button" onClick={handleUploadCampusSpeciesTemplate} className="btn btn-sm btn-success text-white" disabled={isUploadingTemplate}>
                                <FaUpload className="mr-2" /> {isUploadingTemplate ? 'Uploading...' : 'Upload CSV'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )
        }

        {
            exportModal && (
                <Modal title="Export Campus Species" isOpen={exportModal} onClose={toggleExportModal} modalContainerClassName="max-w-2xl">
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-600 mt-6 text-center">Select the fields to include in the Excel export. Species names are included by default.</p>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-700">Export scope</span>
                            <select
                                value={exportScope}
                                onChange={(e) => setExportScope(e.target.value)}
                                className="select select-sm w-full max-w-xs"
                            >
                                {getCampusOptionsForExport().map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {exportFieldOptions.map((option) => (
                                <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={selectedExportFields.includes(option.value)}
                                        onChange={() => handleToggleExportField(option.value)}
                                        className="checkbox checkbox-sm checkbox-primary"
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={toggleExportModal} className="btn btn-sm btn-ghost">Cancel</button>
                            <button type="button" onClick={handleExportCampusSpecies} className="btn btn-sm btn-success text-white">Export Excel</button>
                        </div>
                    </div>
                </Modal>
            )
        }

        <div className="flex flex-1 flex-col w-full pt-4">
            <div className="grid grid-cols-8 gap-2">
                <div className="col-span-2">
                    <div className="flex flex-1 flex-col">
                        <FormikProvider value={formik}>
                            <Form>
                                <div className="flex flex-1 flex-col w-full gap-2 border-2 p-2 px-2 rounded justify-center items-center">
                                    <span className="text-sm">Please fill in the form for mapping</span>
                                    <div className="flex flex-col flex-1 w-full px-2 gap-y-4">
                                        <Select
                                            className="select-sm"
                                            value={formik.values.campus}
                                            options={campusOptions}
                                            onChange={formik.handleChange}
                                            placeholder="Campus"
                                            name="campus"
                                            error={!!formik.errors.campus && formik.touched.campus}
                                            errorText={formik.errors.campus}
                                            required
                                        />
                                        <Select
                                            className="select-sm"
                                            value={selectedCategory}
                                            options={categories}
                                            onChange={e => handleGetSpeciesByCategory(e.target.value)}
                                            placeholder="Category"
                                            name="category"
                                            required
                                        />
                                        <div className="flex flex-row gap-2 items-center justify-center">
                                            <Autocomplete
                                                selectedValue={formik.values.species}
                                                initialSelectedText={initialAutocompleteText}
                                                options={speciesByCategory}
                                                setSelectedValue={handleSelectedSpecies}
                                                onChange={(value) => handleChangeAutocomplete(value)}
                                                initialize={() => getSpeciesByCategory(selectedCategory)}
                                            />
                                            <Tooltip text="View Specie Details">
                                                <LoadingButton
                                                    type="button"
                                                    isLoading={specieProcessing}
                                                    onClick={handleSelectedSpeciesDetails}
                                                    className="btn btn-sm btn-info text-white"
                                                >
                                                    <TbDatabaseSearch />
                                                </LoadingButton>
                                            </Tooltip>
                                        </div>
                                        <div className="flex flex-1 flex-col gap-2 px-2 justify-center items-center border-2 p-2 rounded">
                                            <span className="text-sm">Setup Map Coordinates and Zoom Level</span>
                                            <TextField
                                                type="number"
                                                placeholder="Latitude"
                                                className="input-sm"
                                                name="latitude"
                                                onChange={formik.handleChange}
                                                value={formik.values.latitude}
                                                error={!!formik.errors.latitude && formik.touched.latitude}
                                                errorText={formik.errors.latitude}
                                                required
                                            />
                                            <TextField
                                                type="number"
                                                placeholder="Longitude"
                                                className="input-sm"
                                                name="longitude"
                                                onChange={formik.handleChange}
                                                value={formik.values.longitude}
                                                error={!!formik.errors.longitude && formik.touched.longitude}
                                                errorText={formik.errors.longitude}
                                                required
                                            />
                                            <button onClick={handleMapLocation} type="button" className="btn btn-sm btn-info text-white w-full">
                                                <span className="ml-2">Set Coordinates with Map</span>
                                                <TfiTarget />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-8">
                                            <LoadingButton
                                                isLoading={campusSpeciesProcessing}
                                                className="btn bg-red-700 btn-sm"
                                                type="button"
                                                onClick={handleClearForm}
                                            >
                                                Clear
                                            </LoadingButton>
                                            <LoadingButton
                                                isLoading={campusSpeciesProcessing}
                                                className="btn bg-blue-700 btn-sm"
                                                type="submit"
                                            >
                                                {action === 'add' ? 'Add' : 'Update'}
                                                {action === 'add' ? <FaPlusCircle className="ml-2" /> : <FaCheckCircle className="ml-2" />}
                                            </LoadingButton>
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        </FormikProvider>
                    </div>
                </div>
                <div className="col-span-6">
                    <div className="flex flex-[3] flex-col">
                        <div className="flex flex-row justify-between mb-4 gap-3">
                            <div className="flex flex-row items-center gap-2">
                                <button type="button" onClick={() => setDownloadTemplateModal(true)} className="btn btn-sm btn-info text-white min-w-[140px]">
                                    <FaFileCsv className="mr-2" /> Generate Template
                                </button>
                                <button type="button" onClick={() => setUploadTemplateModal(true)} className="btn btn-sm btn-success text-white min-w-[140px]">
                                    <FaUpload className="mr-2" /> Upload Species
                                </button>
                                <button type="button" onClick={toggleExportModal} className="btn btn-sm btn-success text-white min-w-[110px]">
                                    <FaFileExport className="mr-2" /> Export Species
                                </button>
                                <button type="button" onClick={handlePreviewCampusSpecies} className="btn btn-sm btn-primary text-white min-w-[180px]">
                                    <FaMapMarkerAlt className="mr-2" /> Preview Campus Species
                                </button>
                            </div>
                            <div className="flex flex-row flex-wrap justify-end items-center gap-3 w-full">
                                <div className="flex flex-row items-center min-w-[180px]">
                                    <Select
                                        placeholder="Filter by Campus"
                                        className="select-sm"
                                        options={campusOptions}
                                        onChange={e => handleFilterByCampus(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-row items-center min-w-[180px]">
                                    <Select
                                        placeholder="Filter by Category"
                                        className="select-sm"
                                        options={categories}
                                        onChange={e => handleFilterByCategory(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-row items-center whitespace-nowrap">
                                    <input type="checkbox" checked={isIncludeArchived} onChange={e => setIsIncludeArchived(e.target.checked)} className="checkbox checkbox-primary checkbox-sm" />
                                    <span className="ml-2">Include Archived</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-1 flex-col w-full">
                            <DataTable
                                style={{ maxHeight: 'calc(100vh - 200px)' }}
                                className="min-w-full h-[450px] border-2 px-2"
                                customStyles={{ rows: { style: { cursor: 'pointer', padding: '10px' } } }}
                                columns={columns}
                                progressPending={processing}
                                progressComponent={<div className="flex flex-1 h-[400px]"><Loader text="Fetching records..." /></div>}
                                data={campusSpecies}
                                pagination
                                fixedHeader
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Fragment >
}

export default CampusSpeciesTable;