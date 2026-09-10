import React from 'react';
import { getUnifiedRoomName, getAccommodationAddress } from '../lib/roomNaming';
import { AccommodationAddresses, Language } from '../types';
import { getActiveContractTranslation, ContractTranslationsStore } from '../lib/contractTranslations';
import { IconAlertTriangle } from './Icon';
import { supabase } from '../lib/supabaseClient';

interface TenancyAgreementDocumentProps {
  formData: any;
  monthlyRate: number;
  startDate: string;
  endDate: string;
  signature?: string;
  customAddresses?: AccommodationAddresses | Record<string, string>;
  language?: Language;
  allowDraft?: boolean;
  contractTranslations?: ContractTranslationsStore;
}

const TenancyAgreementDocument: React.ForwardRefRenderFunction<HTMLDivElement, TenancyAgreementDocumentProps> = (
  { formData, monthlyRate, startDate, endDate, signature, customAddresses, language = 'en', allowDraft = false, contractTranslations },
  ref
) => {
  const activeTranslation = getActiveContractTranslation(language, contractTranslations, allowDraft);
  const isRTL = activeTranslation.direction === 'rtl';
  const isFallbackToEnglish = language !== 'en' && activeTranslation.language === 'en';

  const today = new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : language === 'ru' ? 'ru-RU' : language === 'fr' ? 'fr-FR' : language === 'zh' ? 'zh-CN' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const sec = activeTranslation.sections;
  const isPrivate = formData.roomType?.toLowerCase().includes('private');

  // Live state for the signing student's assigned room and bed spaces
  const [liveAssignedRoom, setLiveAssignedRoom] = React.useState<{
    capacity: number;
    bedSpacesCount: number;
    roomType: string;
    roomNumber?: string;
  } | null>(null);

  React.useEffect(() => {
    let isCancelled = false;

    async function fetchLiveRoomData() {
      try {
        const roomId = formData?.roomId || formData?.assignedRoom?.id;
        const bedSpaceId = formData?.bedSpaceId;
        const bookingId = formData?.bookingId;
        const roomNumber = formData?.roomNumber || formData?.roomName;

        let targetRoomId = roomId;

        // If booking ID is provided, look up booking's room_id
        if (!targetRoomId && bookingId) {
          const { data: bData } = await supabase
            .from('bookings')
            .select('room_id, bed_space_id')
            .eq('id', bookingId)
            .maybeSingle();
          if (bData?.room_id) targetRoomId = bData.room_id;
        }

        // If bed space ID is provided, look up bed_space's room_id
        if (!targetRoomId && bedSpaceId) {
          const { data: bsData } = await supabase
            .from('bed_spaces')
            .select('room_id')
            .eq('id', bedSpaceId)
            .maybeSingle();
          if (bsData?.room_id) targetRoomId = bsData.room_id;
        }

        let queriedRoom: any = null;
        if (targetRoomId) {
          const { data: rData } = await supabase
            .from('rooms')
            .select('id, room_number, type, capacity, bed_spaces(id, label)')
            .eq('id', targetRoomId)
            .maybeSingle();
          queriedRoom = rData;
        } else if (roomNumber) {
          const { data: rData } = await supabase
            .from('rooms')
            .select('id, room_number, type, capacity, bed_spaces(id, label)')
            .or(`room_number.eq.${roomNumber},room_number.eq.${roomNumber.toUpperCase()}`)
            .limit(1)
            .maybeSingle();
          queriedRoom = rData;
        }

        // Fallback scoped to room type / category
        if (!queriedRoom && (formData?.roomType || formData?.category)) {
          const isPriv = formData.roomType?.toLowerCase().includes('private');
          let query = supabase.from('rooms').select('id, room_number, type, capacity, bed_spaces(id, label)');
          if (formData.category) {
            query = query.eq('apartment_name', formData.category);
          }
          const { data: rList } = await query;
          if (rList && rList.length > 0) {
            queriedRoom = rList.find((r: any) => isPriv ? r.type?.toLowerCase().includes('private') : !r.type?.toLowerCase().includes('private')) || rList[0];
          }
        }

        if (!isCancelled && queriedRoom) {
          const beds = Array.isArray(queriedRoom.bed_spaces) ? queriedRoom.bed_spaces : [];
          const cap = queriedRoom.capacity || (beds.length > 0 ? beds.length : (queriedRoom.type?.toLowerCase().includes('private') ? 1 : 2));
          setLiveAssignedRoom({
            capacity: cap,
            bedSpacesCount: beds.length,
            roomType: queriedRoom.type,
            roomNumber: queriedRoom.room_number
          });
        }
      } catch (err) {
        console.warn('Live room query in TenancyAgreementDocument error:', err);
      }
    }

    fetchLiveRoomData();
    return () => { isCancelled = true; };
  }, [formData?.roomId, formData?.bedSpaceId, formData?.bookingId, formData?.roomNumber, formData?.roomName, formData?.roomType, formData?.category]);

  // Authoritatively compute real capacity scoped to the specific assigned room
  const liveCapacity = liveAssignedRoom?.capacity 
    ?? formData?.assignedRoom?.capacity 
    ?? (formData.roomType?.toLowerCase().includes('private') ? 1 : 2);

  const isLivePrivate = liveAssignedRoom 
    ? (liveAssignedRoom.capacity === 1 || liveAssignedRoom.roomType?.toLowerCase().includes('private'))
    : (isPrivate || liveCapacity === 1);

  return (
    <div 
      ref={ref} 
      dir={activeTranslation.direction}
      className={`bg-white text-gray-900 p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto font-sans leading-relaxed print:shadow-none print:p-8 print:max-w-none text-xs ${isRTL ? 'text-right' : 'text-left'}`}
    >
      {/* Draft Review / English Fallback Notice */}
      {isFallbackToEnglish && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3 print:hidden">
          <IconAlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Official Binding English Agreement</div>
            <p className="text-amber-700 text-[11px] mt-0.5">
              The Tenancy Agreement is currently served in its legally binding English source version while the requested language translation is undergoing official administrative review.
            </p>
          </div>
        </div>
      )}

      {/* Admin Draft Preview Notice */}
      {allowDraft && activeTranslation.status === 'draft' && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-bold text-[10px] uppercase tracking-wider">DRAFT PREVIEW</span>
            <span className="font-semibold text-xs">Previewing Draft Translation: {activeTranslation.languageName} ({activeTranslation.nativeName})</span>
          </div>
          <span className="text-[11px] text-blue-700 italic">Not yet live for students</span>
        </div>
      )}

      {/* PAGE 1 */}
      <div className="space-y-6 min-h-[950px] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-2 mb-6 text-gray-400 text-[10px]">
            <span className="font-bold tracking-wider text-brand-800 uppercase">
              {activeTranslation.headerTitle} <span className="font-normal text-gray-400">| {activeTranslation.headerSubtitle}</span>
            </span>
            <span>{sec.signatures.pageText.replace('{page}', '1')}</span>
          </div>

          <div className="text-center my-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{activeTranslation.headerTitle}</h1>
            <p className="text-xs text-gray-500 mt-2 font-medium italic">{sec.signatures.agreementDateIntro} {today}</p>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider">
              {sec.parties.title}
            </h2>
            
            <div className="space-y-4">
              {/* Landlord Card */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-brand-800 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-center">
                  {sec.parties.landlordLabel}
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100 divide-y divide-gray-100 text-xs">
                  <div className="p-3 font-bold bg-gray-50 text-gray-600">{sec.parties.landlordNameLabel}</div>
                  <div className="p-3 col-span-2 font-medium text-gray-900">{sec.parties.landlordName}</div>
                  
                  <div className="p-3 font-bold bg-gray-50 text-gray-600">{sec.parties.landlordAddressLabel}</div>
                  <div className="p-3 col-span-2 text-gray-700 leading-normal">{sec.parties.landlordAddress}</div>
                  
                  <div className="p-3 font-bold bg-gray-50 text-gray-600">{sec.parties.landlordPhoneLabel}</div>
                  <div className="p-3 col-span-2 text-gray-700 font-mono" dir="ltr">{sec.parties.landlordPhone}</div>
                </div>
              </div>

              {/* Tenant Card */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                <div className="bg-brand-800 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-center">
                  {sec.parties.tenantLabel}
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100 divide-y divide-gray-100 text-xs">
                  <div className="p-3 font-bold bg-gray-50 text-gray-600">{sec.parties.tenantNameLabel}</div>
                  <div className="p-3 col-span-2 font-medium text-gray-900">{formData.fullName || '_____________________________________'}</div>
                  
                  <div className="p-3 font-bold bg-gray-50 text-gray-600">{sec.parties.tenantNationalityLabel}</div>
                  <div className="p-3 col-span-2 text-gray-700">{formData.nationality || '_____________________________________'}</div>
                  
                  <div className="p-3 font-bold bg-gray-50 text-gray-600">{sec.parties.tenantPassportLabel}</div>
                  <div className="p-3 col-span-2 text-gray-700 font-mono" dir="ltr">{formData.passportNumber || '_____________________________________'}</div>

                  <div className="p-3 font-bold bg-gray-50 text-gray-600">{sec.parties.tenantAddressLabel}</div>
                  <div className="p-3 col-span-2 text-gray-700 leading-normal">{formData.homeAddress || '__________________________________________________________________________'}</div>

                  <div className="p-3 font-bold bg-gray-50 text-gray-600">{sec.parties.tenantPhoneLabel}</div>
                  <div className="p-3 col-span-2 text-gray-700 font-mono" dir="ltr">{formData.whatsappNumber || '_____________________________________'}</div>

                  <div className="p-3 font-bold bg-gray-50 text-gray-600">{sec.parties.tenantEmailLabel}</div>
                  <div className="p-3 col-span-2 text-gray-700" dir="ltr">{formData.email || '_____________________________________'}</div>
                </div>
              </div>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">
              {sec.property.title}
            </h2>
            <div className="space-y-2 text-xs text-gray-700">
              <p>{sec.property.intro}</p>
              <p className="font-bold text-gray-900 text-center py-2">
                {getAccommodationAddress(formData.category, customAddresses)}
              </p>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">
              {sec.term.title}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p><span className="font-bold text-gray-600">{sec.term.commencementLabel}</span> <span className="font-medium">{startDate || '1st July 2026'}</span></p>
                <p><span className="font-bold text-gray-600">{sec.term.expiryLabel}</span> <span className="font-medium">{endDate || '31st August 2026'} ({formData.duration || '2'} {sec.term.durationSuffix})</span></p>
              </div>
              <div className="space-y-2 col-span-1">
                <p><span className="font-bold text-gray-600">{sec.term.renewalLabel}</span> <span className="text-gray-700 font-medium">{sec.term.renewalText}</span></p>
                <p><span className="font-bold text-gray-600">{sec.term.overstayLabel}</span> <span className="text-gray-700 font-medium">{sec.term.overstayText}</span></p>
              </div>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">
              {sec.rent.title}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <p>
                <span className="font-bold text-gray-600">{sec.rent.monthlyRentLabel}</span>{' '}
                <span className="font-bold text-brand-800">
                  USD {monthlyRate || '200'} {sec.rent.monthlyRentPerMonth} ({isPrivate ? sec.rent.privateRoomSuffix : sec.rent.sharedRoomSuffix})
                </span>
              </p>
              <p><span className="font-bold text-gray-600">{sec.rent.paymentLabel}</span> <span className="text-gray-700 font-medium">{sec.rent.paymentText}</span></p>
              <p className="col-span-2"><span className="font-bold text-gray-600">{sec.rent.methodLabel}</span> <span className="text-gray-700 font-medium">{sec.rent.methodText}</span></p>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-10">
              {sec.deposit.title}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <p><span className="font-bold text-gray-600">{sec.deposit.amountLabel}</span> <span className="font-bold">{sec.deposit.amountText.replace('{rate}', String(monthlyRate || '200'))}</span></p>
              <p><span className="font-bold text-gray-600">{sec.deposit.paymentLabel}</span> <span className="text-gray-700 font-medium">{sec.deposit.paymentText}</span></p>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 text-center text-[9px] text-gray-400 font-mono uppercase tracking-wider">
          {sec.signatures.footerText}
        </div>
      </div>

      <div className="page-break my-12 border-t border-dashed border-gray-300 print:hidden"></div>

      {/* PAGE 2 */}
      <div className="space-y-6 min-h-[950px] flex flex-col justify-between print:break-before-page">
        <div>
          <div className="flex justify-between items-center border-b pb-2 mb-6 text-gray-400 text-[10px]">
            <span className="font-bold tracking-wider text-brand-800 uppercase">
              {activeTranslation.headerTitle} <span className="font-normal text-gray-400">| {activeTranslation.headerSubtitle}</span>
            </span>
            <span>{sec.signatures.pageText.replace('{page}', '2')}</span>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <p><span className="font-bold text-gray-600 col-span-1">{sec.deposit.refundLabel}</span> <span className="text-gray-700">{sec.deposit.refundText}</span></p>
              <p><span className="font-bold text-gray-600 col-span-1">{sec.deposit.earlyTerminationLabel}</span> <span className="text-gray-700">{sec.deposit.earlyTerminationText}</span></p>
              <p className="col-span-2"><span className="font-bold text-gray-600">{sec.deposit.noShowLabel}</span> <span className="text-gray-700">{sec.deposit.noShowText}</span></p>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider">
              {sec.utilities.title}
            </h2>
            <p className="text-xs text-gray-700 leading-relaxed">
              {sec.utilities.body}
            </p>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">
              {sec.useOccupancy.title}
            </h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-gray-900">{sec.useOccupancy.useTitle}</h3>
                <p className="text-gray-700 mt-1">{sec.useOccupancy.useBody}</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">{sec.useOccupancy.occupancyTitle}</h3>
                <p className="text-gray-700 mt-1">
                  {(() => {
                    // Concise, room-scoped text definitions by language
                    const roomOccupancyConfig: Record<string, {
                      sharedIntro: string;
                      privateIntro: string;
                      sharedCapacityLabel: string;
                      privateCapacityLabel: string;
                    }> = {
                      en: {
                        sharedIntro: 'The assigned room will accommodate up to 2 residents.',
                        privateIntro: 'The assigned room will accommodate 1 resident.',
                        sharedCapacityLabel: 'up to 2 residents',
                        privateCapacityLabel: '1 resident'
                      },
                      ar: {
                        sharedIntro: 'تتسع الغرفة المخصصة لشخصين (٢ مقيمين).',
                        privateIntro: 'تتسع الغرفة المخصصة لمقيم واحد (١).',
                        sharedCapacityLabel: 'شخصين (٢ مقيمين)',
                        privateCapacityLabel: 'مقيم واحد (١)'
                      },
                      ru: {
                        sharedIntro: 'Выделенная комната рассчитана на проживание до 2 человек.',
                        privateIntro: 'Выделенная комната рассчитана на проживание 1 человека.',
                        sharedCapacityLabel: 'до 2 человек',
                        privateCapacityLabel: '1 человека'
                      },
                      fr: {
                        sharedIntro: 'La chambre attribuée peut accueillir jusqu’à 2 résidents.',
                        privateIntro: 'La chambre attribuée peut accueillir 1 résident.',
                        sharedCapacityLabel: 'jusqu’à 2 résidents',
                        privateCapacityLabel: '1 résident'
                      },
                      uz: {
                        sharedIntro: 'Biriktirilgan xona 2 nafargacha yashovchiga mo‘ljallangan.',
                        privateIntro: 'Biriktirilgan xona 1 nafar yashovchiga mo‘ljallangan.',
                        sharedCapacityLabel: '2 nafargacha yashovchiga',
                        privateCapacityLabel: '1 nafar yashovchiga'
                      },
                      zh: {
                        sharedIntro: '所分配房间最多可容纳 2 名住户。',
                        privateIntro: '所分配房间可容纳 1 名住户。',
                        sharedCapacityLabel: '最多可容纳 2 名住户',
                        privateCapacityLabel: '可容纳 1 名住户'
                      }
                    };

                    const currentConfig = roomOccupancyConfig[language] || roomOccupancyConfig.en;
                    let intro = sec.useOccupancy.occupancyIntro || '';

                    const capValue = isLivePrivate ? '1' : '2';
                    const capLabel = isLivePrivate ? currentConfig.privateCapacityLabel : currentConfig.sharedCapacityLabel;

                    if (intro.includes('{roomCapacity}') || intro.includes('{maxResidents}')) {
                      intro = intro
                        .replace('{roomCapacity}', capLabel)
                        .replace('{maxResidents}', capValue);
                    }

                    // Remove redundant legacy cross-room breakdown clauses if present in stored template
                    intro = intro
                      .replace(/[:;]?\s*(two residents per shared room and one per private room|one resident per private room and two residents per shared room)[.]?/gi, '.')
                      .replace(/[:;]?\s*(مقيمان في كل غرفة مشتركة ومقيم واحد في الغرفة الخاصة|مقيم واحد في الغرفة الخاصة ومقيمان في كل غرفة مشتركة)[.]?/g, '.')
                      .replace(/[:;]?\s*(по два человека в общей комнате и один в отдельной комнате|один человек в отдельной комнате и по два человека в общей комнате)[.]?/g, '.')
                      .replace(/[:;]?\s*(deux résidents par chambre partagée et un par chambre privée|un résident par chambre privée et deux résidents par chambre partagée)[.]?/g, '.')
                      .replace(/[:;]?\s*(umumiy xonada ikki kishi va alohida xonada bir kishi|alohida xonada bir kishi va umumiy xonada ikki kishi)[.]?/g, '.')
                      .replace(/[:;]?\s*(合住房每间两人，单人间每间一人|单人间每间一人，合住房每间两人)[。.]?/g, '。');

                    // Scope opening phrasing strictly to the assigned room rather than generic apartment table
                    intro = intro
                      .replace(/^The apartment (may|will) accommodate up to \d residents/i, `The assigned room will accommodate ${isLivePrivate ? '1 resident' : 'up to 2 residents'}`)
                      .replace(/^The apartment (may|will) accommodate/i, 'The assigned room will accommodate');

                    // If intro contains old static range placeholders or is empty, use authoritative live room clause
                    if (
                      intro.includes('3–4') || 
                      intro.includes('4–5') || 
                      intro.includes('3-4') || 
                      intro.includes('4-5') || 
                      intro.includes('٣ إلى ٤') || 
                      intro.includes('3 至 4') ||
                      intro.includes('3 à 4') ||
                      !intro.trim()
                    ) {
                      intro = isLivePrivate ? currentConfig.privateIntro : currentConfig.sharedIntro;
                    }

                    // Ensure clean trailing period
                    intro = intro.trim();
                    if (!intro.endsWith('.') && !intro.endsWith('。')) {
                      intro += language === 'zh' ? '。' : '.';
                    }

                    return intro;
                  })()}
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 pl-2">
                  {sec.useOccupancy.occupancyPoints.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>
              </div>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">
              {sec.cleaningSafety.title}
            </h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-gray-900">{sec.cleaningSafety.cleaningTitle}</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  {sec.cleaningSafety.cleaningPoints.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">{sec.cleaningSafety.maintenanceTitle}</h3>
                <p className="text-gray-700 mt-1">{sec.cleaningSafety.maintenanceBody}</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">{sec.cleaningSafety.safetyTitle}</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  {sec.cleaningSafety.safetyPoints.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 text-center text-[9px] text-gray-400 font-mono uppercase tracking-wider">
          {sec.signatures.footerText}
        </div>
      </div>

      <div className="page-break my-12 border-t border-dashed border-gray-300 print:hidden"></div>

      {/* PAGE 3 */}
      <div className="space-y-6 min-h-[950px] flex flex-col justify-between print:break-before-page">
        <div>
          <div className="flex justify-between items-center border-b pb-2 mb-6 text-gray-400 text-[10px]">
            <span className="font-bold tracking-wider text-brand-800 uppercase">
              {activeTranslation.headerTitle} <span className="font-normal text-gray-400">| {activeTranslation.headerSubtitle}</span>
            </span>
            <span>{sec.signatures.pageText.replace('{page}', '3')}</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-gray-900">{sec.cleaningSafety.securityTitle}</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  {sec.cleaningSafety.securityPoints.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">
              {sec.houseRules.title}
            </h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-gray-900">{sec.houseRules.visitorTitle}</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2 col-span-1">
                  {sec.houseRules.visitorPoints.map((bullet, idx) => (
                    <li key={idx}>
                      {bullet.includes(sec.houseRules.womenNotice) || bullet.includes('Women') || bullet.includes('النساء') || bullet.includes('Женщинам') || bullet.includes('femmes') || bullet.includes('Ayollarga') || bullet.includes('女性') ? (
                        <strong className="text-brand-800 font-bold">{bullet}</strong>
                      ) : (
                        bullet
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">{sec.houseRules.houseRulesTitle}</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  {sec.houseRules.houseRulesPoints.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">{sec.houseRules.inspectionTitle}</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  {sec.houseRules.inspectionPoints.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">
              {sec.islamicValues.title}
            </h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-gray-900">{sec.islamicValues.communicationTitle}</h3>
                <p className="text-gray-700 mt-1">{sec.islamicValues.communicationBody}</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">{sec.islamicValues.conductTitle}</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  {sec.islamicValues.conductPoints.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">{sec.islamicValues.ethicsTitle}</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  {sec.islamicValues.ethicsPoints.map((bullet, idx) => (
                    <li key={idx}>
                      {bullet.includes(sec.islamicValues.salawatHighlight) || bullet.includes('attend the masjid') || bullet.includes('أداء الصلوات الخمس') || bullet.includes('обязательных молитв') || bullet.includes('prières quotidiennes') || bullet.includes('namozni masjidda') || bullet.includes('清真寺') ? (
                        <strong className="text-brand-800 font-bold">{bullet}</strong>
                      ) : (
                        bullet
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 text-center text-[9px] text-gray-400 font-mono uppercase tracking-wider">
          {sec.signatures.footerText}
        </div>
      </div>

      <div className="page-break my-12 border-t border-dashed border-gray-300 print:hidden"></div>

      {/* PAGE 4 */}
      <div className="space-y-6 min-h-[950px] flex flex-col justify-between print:break-before-page">
        <div>
          <div className="flex justify-between items-center border-b pb-2 mb-6 text-gray-400 text-[10px]">
            <span className="font-bold tracking-wider text-brand-800 uppercase">
              {activeTranslation.headerTitle} <span className="font-normal text-gray-400">| {activeTranslation.headerSubtitle}</span>
            </span>
            <span>{sec.signatures.pageText.replace('{page}', '4')}</span>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider">
              {sec.terminationUndertaking.title}
            </h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-gray-900">{sec.terminationUndertaking.terminationTitle}</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  {sec.terminationUndertaking.terminationPoints.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">{sec.terminationUndertaking.undertakingTitle}</h3>
                <p className="text-gray-700 mt-1 italic">
                  {sec.terminationUndertaking.undertakingIntro.replace('{name}', formData.fullName || '_________________________________')}
                </p>
                <p className="text-gray-700 mt-2">{sec.terminationUndertaking.undertakingAcknowledge}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  {sec.terminationUndertaking.undertakingPoints.map((bullet, idx) => (
                    <li key={idx}>
                      {bullet.includes(sec.terminationUndertaking.extremismHighlight) || bullet.includes('extremist') || bullet.includes('متطرفة') || bullet.includes('экстремистскими') || bullet.includes('extrémiste') || bullet.includes('ekstremistik') || bullet.includes('极端') ? (
                        <strong className="text-gray-950 font-bold">{bullet}</strong>
                      ) : (
                        bullet
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">
              {sec.signatures.title}
            </h2>
            <p className="text-xs text-gray-600">{sec.signatures.intro}</p>

            <div className="grid grid-cols-2 gap-8 text-xs mt-4">
              <div className="space-y-4 border border-gray-100 p-4 rounded-xl">
                <span className="font-bold text-gray-500 block uppercase tracking-widest text-[9px]">{sec.signatures.landlordLabel}</span>
                <div className="pt-8 border-b border-gray-300 font-medium text-gray-900 text-center text-sm font-serif">
                  {sec.parties.landlordName}
                </div>
                <div>
                  <span className="font-bold text-gray-400 block text-[9px] uppercase">{sec.signatures.dateLabel}</span>
                  <span className="font-medium">{today}</span>
                </div>
              </div>

              <div className="space-y-4 border-2 border-brand-100 bg-brand-50/10 p-4 rounded-xl">
                <span className="font-bold text-brand-800 block uppercase tracking-widest text-[9px]">{sec.signatures.tenantLabel}</span>
                <div className="h-14 border-b border-gray-300 flex items-center justify-center overflow-hidden bg-white/70 rounded">
                  {signature ? (
                    <img src={signature} alt="Client Signature" className="max-h-full object-contain" />
                  ) : (
                    <span className="text-gray-300 text-[10px] italic">{sec.signatures.awaitingSignatureText}</span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-gray-400 block text-[9px] uppercase">{sec.signatures.dateLabel}</span>
                  <span className="font-medium">{today}</span>
                </div>
              </div>
            </div>

            {/* WITNESSES SECTION */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                {sec.signatures.witnessesTitle || 'WITNESSES'}
              </h3>
              <div className="grid grid-cols-2 gap-8 text-xs">
                <div className="space-y-3 border border-gray-100 p-3.5 rounded-xl">
                  <span className="font-bold text-gray-500 block uppercase tracking-widest text-[9px]">
                    {sec.signatures.witness1Label || 'WITNESS 1'}
                  </span>
                  <div className="space-y-1">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase">
                      {sec.signatures.witnessNameLabel || 'NAME'}
                    </span>
                    <div className="h-5 border-b border-gray-300"></div>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase">
                      {sec.signatures.witnessDateLabel || 'DATE'}
                    </span>
                    <div className="h-5 border-b border-gray-300"></div>
                  </div>
                </div>

                <div className="space-y-3 border border-gray-100 p-3.5 rounded-xl">
                  <span className="font-bold text-gray-500 block uppercase tracking-widest text-[9px]">
                    {sec.signatures.witness2Label || 'WITNESS 2'}
                  </span>
                  <div className="space-y-1">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase">
                      {sec.signatures.witnessNameLabel || 'NAME'}
                    </span>
                    <div className="h-5 border-b border-gray-300"></div>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase">
                      {sec.signatures.witnessDateLabel || 'DATE'}
                    </span>
                    <div className="h-5 border-b border-gray-300"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="border-t pt-3 text-center text-[9px] text-gray-400 font-mono uppercase tracking-wider">
          {sec.signatures.footerText}
        </div>
      </div>

    </div>
  );
};

export default React.forwardRef(TenancyAgreementDocument);
