import React, { Fragment, useEffect, useState } from 'react';
import { IImages, ISpecies } from '../../interfaces/common.interface';
import SliderComponent from '../slider';
import fallbackImage from "../../../../assets/fallback-image.jpg";
import ImageModal from '../imagemodal';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { animalsList, insectsList, plantsList } from '../../enums/species';
import { TAnimalsDetails, TInsectDetails, TPlantsDetails } from '../../types/common.types';
import AnimalsDetails from '../../../modules/dashboard/details/AnimalsDetails';
import PlantsDetails from '../../../modules/dashboard/details/PlantsDetails';
import InsectsDetails from '../../../modules/dashboard/details/InsectsDetails';

interface SpeciesProps {
    specie?: ISpecies;
}

const SpeciesDetails: React.FC<SpeciesProps> = ({ specie }) => {

    const [images, setImages] = useState<IImages[]>([])
    const [imageLoaded, setImageLoaded] = React.useState<boolean>(false);
    const [selectedImage, setSelectedImage] = React.useState<string>('');
    const [imageModal, setImageModal] = React.useState<boolean>(false);
    const toggleImageModal = () => setImageModal(!imageModal);

    const handleImageModal = (image: string) => {
        setSelectedImage(image);
        toggleImageModal();
    }

    const getSpecieImages = async () => {
        const table = 'species_images';
        try {
            const response = await supabase
                .from(table)
                .select("*, speciesData:species(*)")
                .eq("species", specie?.id)
                .order("id", { ascending: true })
                .is("deleted_at", null);

            if (response.error) {
                toast.error(response.error.message);
                return;
            }

            setImages(response.data);
        } catch (error: unknown) {
            toast.error((error as Error).message);
            return null;
        }
    }

    useEffect(() => {
        getSpecieImages();
    }, [])

    return <Fragment>
        {imageModal && <ImageModal isOpen={imageModal} onClose={toggleImageModal}>
            <div className="flex flex-col items-center justify-center w-full h-full">
                <img
                    src={selectedImage}
                    alt='Zoomed in avatar'
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                />
            </div>
        </ImageModal>
        }
        <div className="flex flex-col p-2 sm:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 flex flex-col">
                    {!imageLoaded && <div className="w-full bg-gray-200 animate-pulse">
                        <div className="flex justify-center items-center min-h-32 sm:min-h-52">
                            <span className="text-gray-400 text-sm">Loading...</span>
                        </div>
                    </div>
                    }
                    {specie?.gdriveid &&
                        <img
                            src={`https://drive.google.com/thumbnail?id=${specie?.gdriveid}&sz=w1000`}
                            alt={specie?.commonName ?? ''}
                            onLoad={() => setImageLoaded(true)}
                            className={`hover:cursor-pointer hover:opacity-90 ${imageLoaded ? 'block' : 'hidden'}`}
                            onError={e => e.currentTarget.src = fallbackImage}
                            onClick={() => handleImageModal(`https://drive.google.com/thumbnail?id=${specie?.gdriveid}&sz=w1000`)}
                        />
                    }
                    {
                        !specie?.gdriveid &&
                        <div className="flex justify-center">
                            <img
                                src={`https://drive.google.com/thumbnail?id=${specie?.gdriveid}&sz=w1000`}
                                alt={specie?.commonName ?? ''}
                                onLoad={() => setImageLoaded(true)}
                                className={`hover:cursor-pointer hover:opacity-90 ${imageLoaded ? 'block' : 'hidden'}`}
                                onError={e => e.currentTarget.src = fallbackImage}
                            />
                        </div>
                    }
                    <div className="flex flex-col justify-start mt-2 gap-y-1 border-[1px] rounded-md p-1.5 sm:p-2">
                        <div className="flex flex-row gap-x-2 border-b-[1px] pb-1 sm:pb-2">
                            <span className="font-semibold text-xs sm:text-sm">Kingdom: </span>
                            <h5 className="text-xs sm:text-md">{specie?.kingdom}</h5>
                        </div>
                        <div className="flex flex-row gap-x-2 border-b-[1px] pb-1 sm:pb-2">
                            <span className="font-semibold text-xs sm:text-sm">Phylum: </span>
                            <h5 className="text-xs sm:text-md">{specie?.phylum}</h5>
                        </div>
                        <div className="flex flex-row gap-x-2 border-b-[1px] pb-1 sm:pb-2">
                            <span className="font-semibold text-xs sm:text-sm">Class: </span>
                            <h5 className="text-xs sm:text-md">{specie?.class}</h5>
                        </div>
                        <div className="flex flex-row gap-x-2 border-b-[1px] pb-1 sm:pb-2">
                            <span className="font-semibold text-xs sm:text-sm">Order: </span>
                            <h5 className="text-xs sm:text-md">{specie?.order}</h5>
                        </div>
                        <div className="flex flex-row gap-x-2 border-b-[1px] pb-1 sm:pb-2">
                            <span className="font-semibold text-xs sm:text-sm">Family: </span>
                            <h5 className="text-xs sm:text-md">{specie?.family}</h5>
                        </div>
                        <div className="flex flex-row gap-x-2 pb-1 sm:pb-2">
                            <span className="font-semibold text-xs sm:text-sm">Genus: </span>
                            <h5 className="text-xs sm:text-md">{specie?.genus}</h5>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-3">
                    <div className="flex flex-col">
                        <span className='text-xs sm:text-sm'>Scientific name</span>
                        <h5 className="card-title italic text-base sm:text-lg">{specie?.scientificName}</h5>
                    </div>
                    <p className="card-text text-justify pl-1 sm:pl-2 mt-2 text-xs sm:text-sm">{specie?.description}</p>
                    <div className="flex flex-col flex-wrap gap-2">
                        {animalsList.includes(specie?.category?.toLowerCase() ?? "") &&
                            <AnimalsDetails specie={specie as ISpecies<TAnimalsDetails>} />
                        }
                        {plantsList.includes(specie?.category?.toLowerCase() ?? "") &&
                            <PlantsDetails specie={specie as ISpecies<TPlantsDetails>} />
                        }
                        {insectsList.includes(specie?.category?.toLowerCase() ?? "") &&
                            <InsectsDetails specie={specie as ISpecies<TInsectDetails>} />
                        }
                    </div>
                    {images.length > 0 && (
                        <>
                            <div className="divider my-2 sm:my-4"></div>
                            <div className="flex flex-1 flex-col">
                                <span className='text-base sm:text-lg font-semibold'>Captured Images</span>
                                <SliderComponent items={images} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    </Fragment>
};

export default SpeciesDetails;