import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import USTPLogo from '../../../assets/ustp-logo-on-white.png';
import { BiMapPin } from "react-icons/bi";
import { FaExternalLinkAlt } from "react-icons/fa";
import { ICampus } from "../../core/interfaces/common.interface";
import { supabase } from "../../core/lib/supabase";
import { toast } from "react-toastify";
import Loader from "../../core/components/loader";

export default function Home() {
    const navigate = useNavigate();
    const [campuses, setCampuses] = useState<ICampus[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getCampuses();
    }, []);

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

            setCampuses(response.data as ICampus[]);
        } catch (error: unknown) {
            toast.error((error as Error).message);
        } finally {
            setLoading(false);
        }
    }

    const handleCampusSelect = (campus: ICampus) => {
        if (campus.id) {
            navigate(`/map?campusId=${campus.id}&coordinates=${campus.latitude},${campus.longitude}&zoom=${campus.zoom || 15}`);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-4 sm:py-6">
                    <div className="flex items-center justify-center gap-3 sm:gap-4">
                        <img
                            src={USTPLogo}
                            alt="USTP Logo"
                            className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
                        />
                        <div className="text-center">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-800">
                                USTP Biodiversity
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                University of Science and Technology of Southern Philippines
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
                {/* Introduction Section */}
                <section className="mb-12 sm:mb-16">
                    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10">
                        <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 space-y-4">
                            <p className="text-base sm:text-lg leading-relaxed">
                                USTP Biodiversity App is a comprehensive digital initiative designed to document,
                                monitor, and celebrate the rich biological diversity found across the University of Science
                                and Technology of Southern Philippines campuses.
                            </p>
                            <p className="leading-relaxed">
                                This serves as an interactive repository showcasing various species of flora and fauna
                                that inhabit our university grounds. From native trees and vibrant butterflies to diverse bird
                                species and unique insects, each entry provides valuable insights into the ecological wealth
                                of our region.
                            </p>
                            <p className="leading-relaxed">
                                This initiative aims to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Promote environmental awareness and conservation among students and faculty</li>
                                <li>Provide educational resources for research and learning</li>
                                <li>Document and preserve knowledge about local biodiversity</li>
                                <li>Foster appreciation for our natural heritage</li>
                            </ul>
                            <p className="leading-relaxed">
                                Explore the interactive maps below to discover the biodiversity of each USTP campus.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Campus Selection Section */}
                <section>
                    <div className="text-center mb-8 sm:mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-3">
                            Explore Our Campuses
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600">
                            Select a campus to view its biodiversity map and discover the species found there
                        </p>
                    </div>

                    {campuses.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-8 text-center">
                            <p className="text-gray-500">No campuses available at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {campuses.map((campus, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleCampusSelect(campus)}
                                    className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 p-6 sm:p-8 text-left border-2 border-transparent hover:border-green-500 transform hover:-translate-y-1"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <BiMapPin className="text-white text-2xl sm:text-3xl" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                                                    {campus.campus}
                                                </h3>
                                                <FaExternalLinkAlt className="text-gray-400 group-hover:text-green-600 flex-shrink-0 mt-1 transition-colors" />
                                            </div>
                                            {campus.address && (
                                                <p className="text-sm sm:text-base text-gray-600 mt-2 leading-relaxed">
                                                    {campus.address}
                                                </p>
                                            )}
                                            <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-green-600 group-hover:text-green-700">
                                                <span>Explore biodiversity</span>
                                                <FaExternalLinkAlt className="text-xs" />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12 sm:mt-16">
                <div className="container mx-auto px-4 py-6 text-center">
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
        </div>
    );
}
