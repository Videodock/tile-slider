import { useEffect, useState } from 'react';

const XS_MATCH_MEDIA: MediaQueryList = matchMedia('screen and (max-width: 479px)'); // mobile
const SM_MATCH_MEDIA: MediaQueryList = matchMedia('screen and (min-width: 480px) and (max-width: 767px)'); // tablet
const MD_MATCH_MEDIA: MediaQueryList = matchMedia('screen and (min-width: 768px) and (max-width: 1023px)'); // tablet large
const LG_MATCH_MEDIA: MediaQueryList = matchMedia('screen and (min-width: 1024px) and (max-width: 1199px)'); // desktop

type Sizes = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type ResponseConfig = Record<Sizes, number>;

export const getSize = (): Sizes => {
  if (XS_MATCH_MEDIA.matches) return 'xs';
  if (SM_MATCH_MEDIA.matches) return 'sm';
  if (MD_MATCH_MEDIA.matches) return 'md';
  if (LG_MATCH_MEDIA.matches) return 'lg';
  else return 'xl';
};

export const useResponsiveSize = (sizes: ResponseConfig[]): number[] => {
  const [size, setSize] = useState(getSize());

  useEffect(() => {
    const mediaQueries = [XS_MATCH_MEDIA, SM_MATCH_MEDIA, MD_MATCH_MEDIA, XS_MATCH_MEDIA];
    const handleChange = () => {
      setSize(getSize());
    };

    mediaQueries.forEach((matchMedia) => matchMedia.addEventListener('change', handleChange));

    return () => {
      mediaQueries.forEach((matchMedia) => matchMedia.removeEventListener('change', handleChange));
    };
  }, []);

  return sizes.map((config) => config[size]);
};
