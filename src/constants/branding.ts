import React from 'react';

export const COMPANY_LOGO_URL =
  'https://jfmyqymmfalmplckimvd.supabase.co/storage/v1/object/sign/Official%20Logo/Glossy%20Teal%20Connected%20Loop%20Emblem.png?token=eyJraWQiOiI4ZGZlYjI4Ny1mNGI3LTQ4ZTYtOTg2NC1kZjNkZTE1YTQwMWIiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJPZmZpY2lhbCBMb2dvL0dsb3NzeSBUZWFsIENvbm5lY3RlZCBMb29wIEVtYmxlbS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyODM4NDIyLCJleHAiOjE4MjQzNzQ0MjJ9.bVC0ZNJo5V6SQUYHk6tawS_Qz4Wwaz7valsGgyNLhA44RfBROm-HdsxtX2LHtuXploAauRTxjtz3NFNXVYbUBw';

export const DoorblyLogoIcon: React.FC<{ className?: string; disableAnimation?: boolean }> = ({
  className = 'w-7 h-7',
  disableAnimation = false
}) =>
  React.createElement('img', {
    src: COMPANY_LOGO_URL,
    alt: 'Doorbly Official Logo',
    className: `${className} ${disableAnimation ? '' : 'animate-flip-360'} bg-white p-0.5 object-contain shadow-xs`
  });

