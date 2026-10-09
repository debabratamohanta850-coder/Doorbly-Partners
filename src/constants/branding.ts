import React from 'react';

export const COMPANY_LOGO_URL =
  'https://tzqdcozwllahqmoqfawt.supabase.co/storage/v1/object/sign/logo/logo%20(2).png?token=eyJraWQiOiIzNzEyNzUwNS0yYTUzLTQ0NmMtOWY3Ni05NGE1NzhkMjRkY2QiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJsb2dvL2xvZ28gKDIpLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTEzODY2NTIsImV4cCI6MTgyMjkyMjY1Mn0.nqeQP1NbDqalfL79bcWVXpgCr8q2q6RSZ1dKaNg_SMEhKjJINBHyp1uBO3xdj80WUgcxvU6nq2C5JUUR0Hcw9A';

export const DoorblyLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) =>
  React.createElement('img', {
    src: COMPANY_LOGO_URL,
    alt: 'Doorbly Partner Logo',
    className: `${className} bg-white p-0.5 object-contain shadow-xs`
  });

