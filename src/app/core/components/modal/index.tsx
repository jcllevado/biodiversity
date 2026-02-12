import { FC, useEffect, useRef } from "react";

type Props = {
    title?: string | React.ReactNode;
    titleClass?: string;
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
    modalContainerClassName?: string;
    showCloseButton?: boolean;
    showHeader?: boolean;
};

const Modal: FC<Props> = ({
    title,
    titleClass = "text-xl font-medium text-gray-900",
    children,
    isOpen,
    onClose,
    className,
    modalContainerClassName = "",
    showCloseButton = true,
    showHeader = true,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            modalRef.current?.classList.remove("hidden");
        } else {
            modalRef.current?.classList.add("hidden");
        }
    }, [isOpen]);

    return (
        <div ref={modalRef} id="custom-modal" tabIndex={-1} className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto ${className}`}>
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className={`relative w-full  max-h-full ${modalContainerClassName}`}>
                <div className="relative bg-white rounded-lg shadow">
                    {showHeader && (
                        <div className="flex items-center justify-between p-4 md:p-5 rounded-t border-gray-200">
                            {title && <h3 className={titleClass}>{title}</h3>}
                            {showCloseButton && (
                                <button
                                    type="button"
                                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                                    onClick={onClose}
                                >
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                    </svg>
                                    <span className="sr-only">Close modal</span>
                                </button>
                            )}
                        </div>
                    )}
                    {/* Modal body */}
                    <div className="p-4 md:p-10 md:pt-0 space-y-4">{children}</div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
