import React from 'react';

export const COMPANY_LOGO_URL =
  'https://fktznwvrlsgmbrisyyac.supabase.co/storage/v1/object/sign/logo/logo%20(2).png?token=eyJraWQiOiJiMjQwZDFlOC0wZDVkLTQ1Y2EtYTdmYy1kNDllYWUyODljMGUiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJsb2dvL2xvZ28gKDIpLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTE1MTY5NzYsImV4cCI6MTgyMzA1Mjk3Nn0.spYpEM43vQKHvC2SnHk5V1TIobClSA7GDrhr5OxJdbw1TdrUVDAcymrwdRbHSlP_L34exW3A1zs2EF1BGYiyIQ';

export const DoorblyLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) =>
  React.createElement('img', {
    src: COMPANY_LOGO_URL,
    alt: 'Doorbly Partner Logo',
    className: `${className} bg-white p-0.5 object-contain shadow-xs`
  });

