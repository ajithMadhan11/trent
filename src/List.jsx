import _ from 'lodash';
import {DATA} from "./Data.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {useMemo} from "react";

const StoreLocations = ({ stores }) => {
    const groupedStores = useMemo(() => _.groupBy(stores, "id"), [stores]);
    const brands = useMemo(() => Object.keys(groupedStores).sort(), [groupedStores]);

    const fixColors = () => {
        document.querySelectorAll("*").forEach((el) => {
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.color.includes("oklch")) {
                el.style.color = computedStyle.color.replace("oklch", "rgb");
            }
            if (computedStyle.backgroundColor.includes("oklch")) {
                el.style.backgroundColor = computedStyle.backgroundColor.replace("oklch", "rgb");
            }
        });
    };


    const loadImageAsBase64 = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/jpeg"));
            };
        });
    };

    const exportToPDFImage = async () => {
        fixColors();

        const element = document.getElementById("pdf-container");
        const canvas = await html2canvas(element, {
            scrollX: 0,
            scrollY: -window.scrollY,
            useCORS: true,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // First page
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save("store-locations.pdf");
    };

    const exportToPDF = async (stores) => {
        const pdf = new jsPDF("p", "mm", "a4");
        const pageHeight = pdf.internal.pageSize.getHeight();
        let y = 20;

        const groupedStores = _.groupBy(stores, "id");
        const brands = Object.keys(groupedStores).sort();

        const storeAnchors = [];

        // TOC
        pdf.setFontSize(18);
        pdf.text("Store Locations", 10, y);
        y += 10;
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 255);

        for (const store of stores) {
            if (y > pageHeight - 20) {
                pdf.addPage();
                y = 20;
            }

            pdf.textWithLink(store.title, 10, y, {
                pageNumber: null, // we’ll fix this after anchors are added
                url: "", // temporarily empty
            });

            storeAnchors.push({ s_id: store.s_id, title: store.title, tocPage: pdf.internal.getCurrentPageInfo().pageNumber, tocY: y });
            y += 8;
        }

        pdf.setTextColor(0, 0, 0);
        pdf.addPage();
        y = 20;

        // Content Section
        const anchorMap = {};

        for (const brand of brands) {
            const brandStores = groupedStores[brand];

            // Header
            if (y > pageHeight - 40) {
                pdf.addPage();
                y = 20;
            }

            pdf.setFontSize(14);
            pdf.text(brand, 10, y);
            pdf.setFontSize(10);
            pdf.text(`${brandStores.length} Locations`, 160, y);
            y += 8;

            for (const store of brandStores) {
                if (y > pageHeight - 60) {
                    pdf.addPage();
                    y = 20;
                }

                const imageData = await loadImageAsBase64(store.image);

                // Store anchor
                anchorMap[store.s_id] = {
                    page: pdf.internal.getCurrentPageInfo().pageNumber,
                    y: y,
                };

                // Store content
                pdf.setFontSize(11);
                pdf.addImage(imageData, "JPEG", 10, y, 60, 40);
                pdf.text(store.title, 75, y + 5);
                pdf.setFontSize(10);
                pdf.text(`Address: ${store.address}`, 75, y + 15);
                pdf.text(`Lat: ${store.lat}`, 75, y + 25);
                pdf.text(`Lng: ${store.lng}`, 120, y + 25);

                y += 50;
            }

            y += 10;
        }

        // Fill in links in TOC now that we have anchor positions
        storeAnchors.forEach(({ s_id, tocPage, tocY }) => {
            const anchor = anchorMap[s_id];
            if (!anchor) return;

            pdf.setPage(tocPage);
            pdf.textWithLink(`Details`, 100, tocY, {
                pageNumber: anchor.page,
                top: anchor.y,
            });
        });

        pdf.save("store-locations-links.pdf");
    };


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => exportToPDF(stores)}
                    className="mb-4 px-4 py-2 border text-white rounded cursor-pointer transition"
                >
                    Export as PDF with anchors
                </button>
                <button
                    onClick={() => exportToPDFImage()}
                    className="mb-4 px-4 py-2 border text-white rounded cursor-pointer transition"
                >
                    Export as PDF without anchors
                </button>
                <button
                    onClick={() => window.print()}
                    className="mb-4 px-4 py-2 border text-white rounded cursor-pointer transition"
                >
                    Export as PDF From Browser
                </button>
            </div>

    <div className="container mx-auto px-4 py-8" id="pdf-container">


        <div>
            {/* Store Names List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stores.map((store) => (
                    <a
                        key={store.s_id}
                        href={`#store-${store.s_id}`}
                        className="px-4 py-2 text-white rounded hover:bg-gray-200 transition block"
                    >
                        {store.title}
                    </a>
                ))}
            </div>

            {/* Stores Grouped by Brand */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {brands.map((brand) => (
                    <div key={brand} className="bg-white shadow-lg rounded-lg overflow-hidden">
                            <div className="border-y p-4 flex items-center space-x-4">
                                <img
                                    src={groupedStores[brand][0].logo}
                                    alt={`${brand} logo`}
                                    className="w-16 h-16 rounded-full object-contain"
                                />
                                <h2 className="text-xl font-bold text-gray-800">{brand}</h2>
                                <span className="ml-auto text-gray-500 text-sm">
                                    {groupedStores[brand].length} Locations
                                </span>
                            </div>

                            <div>
                                {groupedStores[brand].map((store) => (
                                    <div
                                        key={store.s_id}
                                        id={`store-${store.s_id}`}
                                        className="border-b last:border-b-0 p-4 hover:bg-gray-50 transition duration-200"
                                    >
                                        <div className="h-48 overflow-hidden mb-4 rounded-lg">
                                            <img
                                                src={store.image}
                                                alt={store.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        <div>
                                            <p className="text-gray-600 mb-2">
                                                <strong>Address:</strong> {store.address}
                                            </p>
                                            <div className="flex justify-between text-sm text-gray-500">
                                                <span>Latitude: {store.lat}</span>
                                                <span>Longitude: {store.lng}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </div>
    );
};

export const List = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold text-center my-6">Store Locations</h1>
            <StoreLocations stores={DATA} />
        </div>
    );
};
