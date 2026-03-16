import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import USTPLogo from '../../../assets/ustp-logo-on-white.png';
import { FaExternalLinkAlt } from "react-icons/fa";
import { BiMapPin } from "react-icons/bi";
import { BiNavigation } from "react-icons/bi";
import { BiCart } from "react-icons/bi";
import Modal from "../../core/components/modal";
import ImageModal from "../../core/components/imagemodal";
import { ICampus } from "../../core/interfaces/common.interface";
import { supabase } from "../../core/lib/supabase";
import { toast } from "react-toastify";
import biodiversityLogo from '../../../assets/biodiversity-green.png';
import defaultFeather from '../../../assets/feathers/Feathers.png';
import cdoFeather from '../../../assets/feathers/CDO.png';
import claveriaFeather from '../../../assets/feathers/Claveria.png';
import jasaanFeather from '../../../assets/feathers/Jasaan.png';
import villanuevaFeather from '../../../assets/feathers/Villanueva.png';
import alubijidFeather from '../../../assets/feathers/Alubijid.png';
import oroquietaFeather from '../../../assets/feathers/Oroquieta.png';
import panaonFeather from '../../../assets/feathers/Panaon.png';
import alibangbangCover from '../../../assets/covers/alibangbang.jpeg';
import huniCover from '../../../assets/covers/huni.jpeg';
import ustpBioBackground from '../../../assets/ustp-bio.jpg';
import presidentImage from '../../../assets/leaders/ustp-president.jpg';
import chancellorCdoImage from '../../../assets/leaders/chancellor-cdo.jpg';
import chancellorClaveriaImage from '../../../assets/leaders/chancellor-claveria.jpg';
import researchLeaderImage from '../../../assets/leaders/research-leader.png';
import {
    RESEARCH_TEAM_LEADER_MESSAGE,
    USTP_CDO_CHANCELLOR_MESSAGE,
    USTP_CLAVERIA_CHANCELLOR_MESSAGE,
    USTP_PRESIDENT_MESSAGE,
} from './constants/leader-messages/index';

const MIN_LOADING_DELAY_MS = 1200;
const CAROUSEL_INTERVAL_MS = 3600;

const campusFeatherMap: { keywords: string[]; image: string }[] = [
    { keywords: ['cdo', 'cagayan de oro'], image: cdoFeather },
    { keywords: ['claveria'], image: claveriaFeather },
    { keywords: ['jasaan'], image: jasaanFeather },
    { keywords: ['villanueva'], image: villanuevaFeather },
    { keywords: ['alubijid'], image: alubijidFeather },
    { keywords: ['oroquieta'], image: oroquietaFeather },
    { keywords: ['panaon'], image: panaonFeather },
];

const speciesCarouselImages = [
    { src: alibangbangCover, alt: 'Alibangbang cover' },
    { src: huniCover, alt: 'Huni cover' },
];

const teamMembers = Array.from({ length: 32 }, (_, index) => ({
    id: index + 1,
    name: `Team Member ${index + 1}`,
    role: 'Project Contributor',
}));

export default function Home() {
    const navigate = useNavigate();
    const [campuses, setCampuses] = useState<ICampus[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [carouselIndex, setCarouselIndex] = useState<number>(0);
    const [campusModalOpen, setCampusModalOpen] = useState<boolean>(false);
    const [isSectionHelperOpen, setIsSectionHelperOpen] = useState<boolean>(false);
    const [carouselPreviewOpen, setCarouselPreviewOpen] = useState<boolean>(false);
    const mainContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getCampuses();
    }, []);

    useEffect(() => {
        if (carouselPreviewOpen) return;

        const interval = setInterval(() => {
            setCarouselIndex((prev) => (prev + 1) % speciesCarouselImages.length);
        }, CAROUSEL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [carouselPreviewOpen]);

    const getCampuses = async () => {
        const loadStartTime = Date.now();
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

            setCampuses(response.data as ICampus[]);
        } catch (error: unknown) {
            toast.error((error as Error).message);
        } finally {
            const elapsed = Date.now() - loadStartTime;
            const remainingDelay = Math.max(MIN_LOADING_DELAY_MS - elapsed, 0);
            setTimeout(() => setLoading(false), remainingDelay);
        }
    }

    const handleCampusSelect = (campus: ICampus) => {
        if (campus.id) {
            navigate(`/map?campusId=${campus.id}&coordinates=${campus.latitude},${campus.longitude}&zoom=${campus.zoom || 15}`);
        }
    }

    const getCampusFeather = (campusName?: string | null) => {
        if (!campusName) return defaultFeather;
        const normalizedName = campusName.toLowerCase();
        const match = campusFeatherMap.find(({ keywords }) => keywords.some((keyword) => normalizedName.includes(keyword)));
        return match?.image ?? defaultFeather;
    }

    const scrollToSection = (sectionId: string) => {
        const sectionElement = document.getElementById(sectionId);
        if (!sectionElement) return;

        if (window.innerWidth >= 1024 && mainContentRef.current) {
            const container = mainContentRef.current;
            const targetTop = sectionElement.offsetTop - container.offsetTop - 8;
            container.scrollTo({ top: targetTop, behavior: 'smooth' });
        } else {
            sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        setIsSectionHelperOpen(false);
    };

    const sectionLinks = [
        { id: 'about-ustp-biodiversity', label: 'About' },
        { id: 'research-project-leader', label: 'Research Leader' },
        { id: 'ustp-president', label: 'USTP President' },
        { id: 'ustp-cdo-chancellor', label: 'CDO Chancellor' },
        { id: 'ustp-claveria-chancellor', label: 'Claveria Chancellor' },
        { id: 'team-members', label: 'Team Members' },
    ];

    const leadershipSections = [
        {
            title: 'Research Team Leader',
            subtitle: 'CORDULO P. ASCAÑO II, PhD',
            description: RESEARCH_TEAM_LEADER_MESSAGE,
            image: researchLeaderImage,
        },
        {
            title: 'USTP President',
            subtitle: 'DR. AMBROSIO B. CULTURA II',
            description: USTP_PRESIDENT_MESSAGE,
            image: presidentImage,
        },
        {
            title: 'USTP CDO Chancellor',
            subtitle: 'ATTY. DIONEL O. ALBINA',
            description: USTP_CDO_CHANCELLOR_MESSAGE,
            image: chancellorCdoImage,
        },
        {
            title: 'USTP Claveria Chancellor',
            subtitle: 'DR. RENATO O. ARAZO',
            description: USTP_CLAVERIA_CHANCELLOR_MESSAGE,
            image: chancellorClaveriaImage,
        }
    ];

    if (loading) {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center px-6"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.82), rgba(255,255,255,0.82)), url(${ustpBioBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <img
                    src={USTPLogo}
                    alt="USTP Logo"
                    className="w-24 h-24 sm:w-28 sm:h-28 mb-4 object-contain"
                />
                <img
                    src={biodiversityLogo}
                    alt="Biodiversity"
                    className="w-64 sm:w-80 md:w-96 mb-6 object-contain"
                />
                <img
                    src={defaultFeather}
                    alt="Loading biodiversity map"
                    className="home-feather-loader w-[min(78vw,460px)] h-[min(44vh,320px)] object-contain"
                />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen lg:h-screen lg:overflow-hidden"
            style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.84), rgba(255,255,255,0.84)), url(${ustpBioBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
            }}
        >
            <main className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 lg:h-full">
                <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-4 sm:gap-6 lg:gap-8 lg:h-full">
                    <aside className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-4 lg:h-full lg:sticky lg:top-0 flex flex-col overflow-hidden">
                        <div className="flex flex-col flex-1 min-h-0">
                            <div className="relative flex-1 min-h-[340px] overflow-hidden rounded-xl bg-white flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => setCarouselPreviewOpen(true)}
                                    className="w-full h-full p-0"
                                    aria-label="View carousel image"
                                >
                                    <img
                                        src={speciesCarouselImages[carouselIndex].src}
                                        alt={speciesCarouselImages[carouselIndex].alt}
                                        className="w-full h-full object-contain p-4 transition-opacity duration-500 cursor-zoom-in"
                                    />
                                </button>
                            </div>
                            <div className="mt-4 mb-2 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCampusModalOpen(true)}
                                    className="rounded-xl bg-[#003DA5] text-white font-bold py-3 px-5 hover:bg-[#0E4DB8] transition-colors inline-flex items-center justify-center gap-2"
                                >
                                    <BiMapPin className="text-lg" />
                                    Explore Our Campuses
                                </button>
                                <button
                                    type="button"
                                    className="rounded-xl bg-[#F2A900] text-gray-900 font-bold py-3 px-5 hover:bg-[#E69500] transition-colors inline-flex items-center justify-center gap-2"
                                >
                                    <BiCart className="text-lg" />
                                    Buy our Coffee Table
                                </button>
                            </div>
                        </div>
                    </aside>

                    <div ref={mainContentRef} className="space-y-4 sm:space-y-6 lg:h-full lg:overflow-y-auto lg:pr-2">
                        <section className="space-y-6">
                            <article id="about-ustp-biodiversity" className="p-6 sm:p-8">
                                <h2 className="text-2xl sm:text-3xl font-bold text-[#003DA5] mb-3">About USTP Biodiversity</h2>
                                <div className="text-gray-700 space-y-3 leading-relaxed">
                                    <p>
                                        USTP Biodiversity is a digital initiative that documents, monitors, and celebrates species diversity across USTP campuses.
                                        It provides a guided way to explore local flora and fauna while supporting learning, research, and conservation awareness.
                                    </p>
                                    <p>
                                        This page is organized into dedicated content divisions to present program highlights and leadership perspectives.
                                        The data and stories can be expanded over time as more campus biodiversity records are added.
                                    </p>
                                </div>
                            </article>

                            {leadershipSections.map((section) => (
                                <article
                                    id={section.title.toLowerCase().replace(/\s+/g, '-')}
                                    key={section.title}
                                    className="p-6 sm:p-8"
                                >
                                    <div className="flex flex-col gap-5 sm:gap-6 items-center">
                                        <div className="w-full sm:w-56 md:w-64 max-w-[300px] mx-auto flex-shrink-0">
                                            <img
                                                src={section.image}
                                                alt={section.title}
                                                className="w-full aspect-[4/5] rounded-xl border border-gray-200 bg-gray-50 object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 text-center w-full">
                                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{section.subtitle}</h3>
                                            <p className="text-base sm:text-lg font-semibold text-[#003DA5] mt-1">{section.title}</p>
                                            <div className="text-gray-700 leading-relaxed mt-4 text-justify space-y-3">
                                                {Array.isArray(section.description) ? (
                                                    section.description.map((paragraph, idx) => (
                                                        <p key={idx} className="indent-8">{paragraph}</p>
                                                    ))
                                                ) : (
                                                    <p className="indent-8">{section.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}

                            <article id="team-members" className="p-6 sm:p-8">
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">Team Members</h3>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                                    {teamMembers.map((member) => (
                                        <div key={member.id} className="border border-gray-200 rounded-xl p-3 text-center bg-white hover:bg-[#003DA5]/5 transition-colors">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                                                <span className="text-[10px] sm:text-xs font-semibold text-gray-500">Photo</span>
                                            </div>
                                            <p className="mt-2 text-xs sm:text-sm font-semibold text-gray-800 leading-tight line-clamp-2">{member.name}</p>
                                            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{member.role}</p>
                                        </div>
                                    ))}
                                </div>
                            </article>

                            <footer className="mt-2">
                                <div className="px-1 py-3 text-center">
                                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                        © {new Date().getFullYear()} University of Science and Technology of Southern Philippines.
                                        All rights reserved.
                                    </p>
                                    <a
                                        href="https://ustp.edu.ph/"
                                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Visit USTP Website
                                        <FaExternalLinkAlt size={10} />
                                    </a>
                                </div>
                            </footer>
                        </section>

                    </div>
                </div>
            </main>

            {campusModalOpen && (
                <Modal
                    title="USTP Campuses"
                    isOpen={campusModalOpen}
                    onClose={() => setCampusModalOpen(false)}
                    modalContainerClassName="max-w-3xl"
                    contentClassName="border-2 border-[#003DA5]/35"
                    showHeader={false}
                    closeOnBackdropClick={true}
                    enableSwipeToClose={true}
                >
                    {campuses.length === 0 ? (
                        <div className="text-sm text-gray-600 py-2">No campuses available at the moment.</div>
                    ) : (
                        <div className="w-full space-y-3 mt-2">
                            {campuses.map((campus, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        handleCampusSelect(campus);
                                        setCampusModalOpen(false);
                                    }}
                                    className="group w-full rounded-xl border border-gray-200 p-3 sm:p-4 text-left hover:border-[#003DA5] hover:bg-[#003DA5]/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#F2A900]/60 bg-white flex items-center justify-center overflow-hidden group-hover:border-[#F2A900] transition-colors flex-shrink-0">
                                            <img
                                                src={getCampusFeather(campus.campus)}
                                                alt={`${campus.campus} feather`}
                                                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-lg sm:text-xl font-extrabold text-[#003DA5] leading-tight truncate tracking-wide">
                                                {campus.campus}
                                            </p>
                                            {campus.address && (
                                                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                                                    {campus.address}
                                                </p>
                                            )}
                                        </div>
                                        <FaExternalLinkAlt className="text-sm text-[#003DA5] flex-shrink-0" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </Modal>
            )}

            {carouselPreviewOpen && (
                <ImageModal isOpen={carouselPreviewOpen} onClose={() => setCarouselPreviewOpen(false)}>
                    <div className="flex flex-col items-center justify-center w-full h-full">
                        <img
                            src={speciesCarouselImages[carouselIndex].src}
                            alt={speciesCarouselImages[carouselIndex].alt}
                            className="max-w-full max-h-full w-auto h-auto object-contain"
                        />
                    </div>
                </ImageModal>
            )}

            <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
                {sectionLinks.map((link, index) => (
                    <button
                        key={link.id}
                        type="button"
                        onClick={() => scrollToSection(link.id)}
                        className={`inline-flex items-center gap-2 rounded-full bg-white border border-[#003DA5]/25 text-[#003DA5] text-sm font-semibold px-3 py-2 shadow-md hover:bg-[#003DA5]/10 transition-all duration-200 ${isSectionHelperOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
                        style={{ transitionDelay: isSectionHelperOpen ? `${index * 45}ms` : '0ms' }}
                        aria-label={`Go to ${link.label}`}
                    >
                        <span className="w-2 h-2 rounded-full bg-[#F2A900]"></span>
                        {link.label}
                    </button>
                ))}

                <button
                    type="button"
                    onClick={() => setIsSectionHelperOpen((prev) => !prev)}
                    className="h-14 w-14 rounded-full bg-[#003DA5] text-white shadow-xl hover:bg-[#0E4DB8] inline-flex items-center justify-center"
                    aria-label="Toggle section navigation"
                >
                    <BiNavigation className={`text-2xl transition-transform duration-200 ${isSectionHelperOpen ? 'rotate-45' : 'rotate-0'}`} />
                </button>
            </div>
        </div>
    );
}
