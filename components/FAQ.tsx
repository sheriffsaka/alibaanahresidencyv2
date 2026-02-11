
import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { IconChevronDown } from './Icon';

const FAQ: React.FC = () => {
    const t = useTranslation();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        { q: t.faqQ1, a: t.faqA1 },
        { q: t.faqQ2, a: t.faqA2 },
        { q: t.faqQ3, a: t.faqA3 },
        { q: t.faqQ4, a: t.faqA4 },
    ];

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    {t.faqTitle}
                </h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                    {t.faqSubtitle}
                </p>
            </div>
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <button
                            onClick={() => toggleFaq(index)}
                            className="w-full flex justify-between items-center text-left rtl:text-right text-lg font-semibold text-gray-800 dark:text-gray-200"
                        >
                            <span>{faq.q}</span>
                            <IconChevronDown className={`w-6 h-6 transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openIndex === index ? 'max-h-96 mt-4' : 'max-h-0'}`}>
                            <p className="text-gray-600 dark:text-gray-400">
                                {faq.a}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQ;
