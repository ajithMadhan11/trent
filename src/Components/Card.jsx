import React from 'react';

const BusinessCard = ({ data, onClick }) => {
    return (
        <div className="w-full bg-white p-1 rounded-md border border-gray-300 overflow-hidden h-30 flex cursor-pointer" onClick={onClick}>
            {/* Left Content Section (75%) */}
            <div className="w-2/3 p-2 flex flex-col justify-between">
                {/* Title and Details */}
                <div>
                    <h2 className="text-md font-bold text-gray-800">{data.title}</h2>

                    {/* Address */}
                    <div className="text-sm text-gray-500">
                        <p className="line-clamp-3">{data.address}</p>
                    </div>
                </div>

                {/* Brand Logo */}
                <div className="mt-4">
                    <img src={data.logo} alt="Brand Logo" className="h-5 w-auto" />
                </div>
            </div>

            {/* Vertical Separation Line */}
            <div className="border-r border-gray-300 h-full"></div>

            {/* Image Section (25%) */}
            <div className="w-1/3 p-1">
                <img src={data.image} alt="Business Image" className="w-full h-full object-cover" />
            </div>
        </div>
    );
};

export default BusinessCard;
