import React from 'react';
import { DarshanSlot, AartiSlot } from '@/utils/api';

interface SlotCardProps {
  type: 'darshan' | 'aarti';
  date: string; // API date string (YYYY-M-D)
  formattedDate: string; // Human-readable date
  slots: (DarshanSlot | AartiSlot)[];
  minPersons: number;
  maxPersons: number;
  price: number | null;
}

export default function SlotCard({
  type,
  formattedDate,
  slots,
  minPersons,
  maxPersons,
  price
}: SlotCardProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6 border-l-4 border-indigo-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">{formattedDate}</h3>
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
          {type === 'darshan' ? 'Darshan' : 'Aarti'}
        </span>
      </div>
      
      <div className="mb-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Person Limits:</span>
          <span className="font-medium">{minPersons} - {maxPersons}</span>
        </div>
        <div className="flex justify-between">
          <span>Price:</span>
          <span className="font-medium">{price ? `₹${price}` : 'Free'}</span>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Available Slots:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {slots.map((slot, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
              <div className="font-medium text-gray-800">{slot.slotName}</div>
              <div className="text-sm text-gray-600 mt-1">
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span className="font-medium text-green-600">{slot.noOfTicketsAvailable}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{type === 'darshan' 
                    ? `${(slot as DarshanSlot).slotBeginTime} - ${(slot as DarshanSlot).slotEndTime}`
                    : `${(slot as AartiSlot).slotBeginTime} - ${(slot as AartiSlot).slotEndTime}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Reporting:</span>
                  <span>{type === 'darshan' 
                    ? (slot as DarshanSlot).reportingTime
                    : `${(slot as AartiSlot).reportingStartTime} - ${(slot as AartiSlot).reportingEndTime}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 