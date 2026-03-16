import React, { Fragment } from 'react';
import { ISpecies } from '../../../core/interfaces/common.interface';
import { TAnimalsDetails } from '../../../core/types/common.types';
import { getDietIcons } from '../../../core/helpers/diet';

interface Props {
    specie?: ISpecies<TAnimalsDetails>;
}

const AnimalsDetails: React.FC<Props> = ({ specie }) => {

    const dietIcons = getDietIcons(specie?.details?.diet);

    return <Fragment>
        <div className="flex flex-col flex-wrap gap-2">
            <div className="flex flex-col flex-wrap">
                <div className="flex flex-col mt-4">
                    <span className="font-semibold text-sm">Habitats</span>
                    <span className='pl-2 mb-2 text-sm'>{specie?.details?.habitats}</span>
                </div>
                <div className="flex flex-row justify-evenly flex-wrap flex-shrink gap-2">
                    <div className="border-[1px] rounded-md p-2 flex flex-col flex-1 min-w-64">
                        <span className="font-semibold text-sm">Conservation Status:</span>
                        <span className='text-sm'>{specie?.details?.conservationStatus}</span>
                    </div>
                    <div className="border-[1px] rounded-md p-2 flex flex-col flex-1 min-w-64">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">Diet:</span>
                            <div className="flex items-center gap-1">
                                {dietIcons.map((icon, index) => (
                                    <img
                                        key={index}
                                        src={icon}
                                        alt="Diet icon"
                                        className="w-5 h-5 object-contain"
                                    />
                                ))}
                            </div>
                        </div>
                        <span className='text-sm'>{specie?.details?.diet}</span>
                    </div>
                    <div className="border-[1px] rounded-md p-2 flex flex-col flex-1 min-w-64">
                        <span className="font-semibold text-sm">Ecological Importance :</span>
                        <span className='text-sm'>{specie?.details?.ecologicalImportance}</span>
                    </div>
                    {specie?.details?.endemism && specie?.details?.endemism !== '' &&
                        <div className="border-[1px] rounded-md p-2 flex flex-col flex-1 min-w-64">
                            <span className="font-semibold text-sm">Endemism:</span>
                            <span className='text-sm'>{specie?.details?.endemism}</span>
                        </div>
                    }
                    <div className="border-[1px] rounded-md p-2 flex flex-col flex-1 min-w-64">
                        <span className="font-semibold text-sm">Distribution:</span>
                        <span className='text-sm'>{specie?.details?.distribution}</span>
                    </div>
                </div>
            </div>
        </div>
    </Fragment>
};

export default AnimalsDetails;