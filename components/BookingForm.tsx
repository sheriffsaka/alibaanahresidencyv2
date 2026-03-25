
import React, { useState, ChangeEvent } from 'react';
import { Room, BookingStatus, Booking, AccommodationType } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';
import { IconUpload } from './Icon';
import { uploadFile, generateFileName } from '../lib/storage';

import { COUNTRIES } from '../countries';

interface BookingFormProps {
  room: Room;
}

const BookingForm: React.FC<BookingFormProps> = ({ room }) => {
  const t = useTranslation();
  const { user, setPage, addBooking, addActivity, students } = useApp();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    nationality: '', 
    passportNumber: '',
    email: user?.email || '',
    phoneNumber: '',
    arrivalDate: '',
    duration: '',
    accommodationType: room.type,
    emergencyContact: '',
    buildingNo: '',
    flatNo: '',
    streetName: '',
    districtName: '',
    state: '',
    contractLanguage: 'en' as 'en' | 'fr' | 'ru',
  });
  const [passportCopy, setPassportCopy] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPassportCopy(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setPage('auth');
      return;
    }
    
    if (!passportCopy) {
      setError("A copy of your international passport is mandatory.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Upload passport copy to Supabase Storage
      const fileName = generateFileName(passportCopy.name);
      const passport_copy_url = await uploadFile('passports', fileName, passportCopy);

      // 2. Calculate end date and total price
      const startDate = new Date(formData.arrivalDate);
      const durationMatch = formData.duration.match(/(\d+)/);
      const durationMonths = durationMatch ? parseInt(durationMatch[1]) : 1;
      
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + durationMonths);
      
      const totalPrice = room.price_per_month * durationMonths;

      // 3. Create booking object
      const newBooking: Partial<Booking> = {
          student_id: (user.role !== 'student' && selectedStudentId) ? selectedStudentId : user.id,
          room_id: room.id,
          start_date: formData.arrivalDate,
          end_date: endDate.toISOString().split('T')[0], 
          status: BookingStatus.PENDING_PAYMENT,
          booked_at: new Date().toISOString(),
          full_name: formData.fullName,
          nationality: formData.nationality,
          passport_number: formData.passportNumber,
          passport_copy_url,
          email: formData.email,
          phone_number: formData.phoneNumber,
          expected_arrival_date: formData.arrivalDate,
          duration_of_stay: formData.duration,
          preferred_accommodation: formData.accommodationType,
          emergency_contact_details: formData.emergencyContact,
          building_no: formData.buildingNo,
          flat_no: formData.flatNo,
          street_name: formData.streetName,
          district_name: formData.districtName,
          state: formData.state,
          address_in_egypt: `${formData.buildingNo}, ${formData.flatNo}, ${formData.streetName}, ${formData.districtName}, ${formData.state}`,
          contract_language: formData.contractLanguage as any,
          total_price: totalPrice,
          rooms: { room_number: room.room_number, type: room.type },
      };

      // 4. Save to database
      const result = await addBooking(newBooking as Booking);
      
      if (!result.success) {
          throw new Error(result.error || "Failed to save booking");
      }
      
      const savedBooking = result.data;

      // 5. Add activity
      await addActivity({
        user_id: user.id,
        type: 'booking',
        description: `New booking application for Room ${room.room_number} (BK${savedBooking.id})`,
        timestamp: new Date().toISOString()
      });

      alert(t.bookingSuccess);
      setPage('dashboard');
    } catch (err: any) {
      console.error("Booking submission error:", err);
      setError(`Failed to submit booking: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {user?.role !== 'student' && students.length > 0 && (
        <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl border border-brand-100 dark:border-brand-800 mb-6">
          <label className="block text-sm font-bold text-brand-800 dark:text-brand-200 mb-2">
            Book on behalf of an existing student (Optional)
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => {
              const studentId = e.target.value;
              setSelectedStudentId(studentId);
              if (studentId) {
                const student = students.find(s => s.id === studentId);
                if (student) {
                  setFormData(prev => ({
                    ...prev,
                    fullName: student.full_name || '',
                  }));
                }
              }
            }}
            className="w-full p-3 border border-brand-200 dark:border-brand-800 rounded-lg dark:bg-gray-800"
          >
            <option value="">-- Select Student --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
          <p className="text-[10px] text-brand-600 mt-1">If no student is selected, the booking will be associated with your admin account.</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField name="fullName" label={t.fullName} value={formData.fullName} onChange={handleInputChange} required />
        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.nationality}</label>
          <select 
            id="nationality" 
            name="nationality" 
            value={formData.nationality} 
            onChange={handleInputChange} 
            className="mt-1 block w-full pl-3 pr-10 py-3 text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-lg"
            required
          >
            <option value="">Select Nationality</option>
            {COUNTRIES.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
        <InputField name="passportNumber" label={t.passportNumber} value={formData.passportNumber} onChange={handleInputChange} required />
        <InputField name="email" label={t.email} type="email" value={formData.email} onChange={handleInputChange} required />
        <InputField name="phoneNumber" label={t.phoneNumber} value={formData.phoneNumber} onChange={handleInputChange} required />
        <InputField name="arrivalDate" label={t.arrivalDate} type="date" value={formData.arrivalDate} onChange={handleInputChange} required />
        <InputField name="duration" label={t.durationOfStay} value={formData.duration} onChange={handleInputChange} required placeholder="e.g., 6 months" />
        <div>
          <label htmlFor="accommodationType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.preferredAccommodation}</label>
          <select id="accommodationType" name="accommodationType" value={formData.accommodationType} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-3 text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-lg">
            {Object.values(AccommodationType).map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <InputField name="emergencyContact" label={t.emergencyContact} value={formData.emergencyContact} onChange={handleInputChange} required />
        <div className="md:col-span-2 space-y-4 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border dark:border-gray-700">
          <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">{t.addressInEgypt}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField name="buildingNo" label="Building No." value={formData.buildingNo} onChange={handleInputChange} placeholder="e.g., 12" />
            <InputField name="flatNo" label="Flat No." value={formData.flatNo} onChange={handleInputChange} placeholder="e.g., 4B" />
          </div>
          <InputField name="streetName" label="Street Name" value={formData.streetName} onChange={handleInputChange} placeholder="e.g., Al-Nasr Street" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField name="districtName" label="District" value={formData.districtName} onChange={handleInputChange} placeholder="e.g., Nasr City" />
            <InputField name="state" label="State/City" value={formData.state} onChange={handleInputChange} placeholder="e.g., Cairo" />
          </div>
        </div>
        <div>
          <label htmlFor="contractLanguage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.contractLanguage}</label>
          <select id="contractLanguage" name="contractLanguage" value={formData.contractLanguage} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-3 text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-lg">
            <option value="en">{t.contractLanguageEn}</option>
            <option value="fr">{t.contractLanguageFr}</option>
            <option value="ru">{t.contractLanguageRu}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.passportCopy}</label>
        <div className="mt-2">
          <label htmlFor="passport-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-bold text-brand-600 hover:text-brand-500 border border-gray-300 dark:border-gray-600 p-3 flex items-center justify-center shadow-sm">
            <IconUpload className="w-5 h-5 me-2" />
            <span>{passportCopy ? passportCopy.name : 'Upload Passport Copy'}</span>
            <input id="passport-upload" name="passport-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf" required />
          </label>
        </div>
      </div>
      
      {error && <p className="text-sm text-red-500 font-bold mb-4">{error}</p>}
      
      <button 
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-xl text-base font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform active:scale-95"
      >
        {isSubmitting ? 'Submitting Application...' : t.confirmBooking}
      </button>
    </form>
  );
};

const InputField = ({ label, ...props }) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <input id={props.name} {...props} className="mt-1 block w-full pl-3 pr-10 py-3 text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-lg" />
  </div>
);

export default BookingForm;