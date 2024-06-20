import { useEffect, useState } from 'react';

let memoizedMediaQueries: MediaQueryList[] = [];

const getMediaQueries = () => {
  if (!memoizedMediaQueries.length && typeof window !== 'undefined') {
    const xs: MediaQueryList = matchMedia('screen and (max-width: 479px)'); // mobile
    const sm: MediaQueryList = matchMedia('screen and (min-width: 480px) and (max-width: 767px)'); // tablet
    const md: MediaQueryList = matchMedia('screen and (min-width: 768px) and (max-width: 1023px)'); // tablet large
    const lg: MediaQueryList = matchMedia('screen and (min-width: 1024px) and (max-width: 1199px)'); // desktop

    memoizedMediaQueries = [xs, sm, md, lg];
  }

  return memoizedMediaQueries;
};

type Sizes = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type ResponseConfig = Record<Sizes, number>;

const getSize = (): Sizes => {
  const [xs, sm, md, lg] = getMediaQueries();

  if (!xs) return 'md'; // default to sm screen size

  if (xs.matches) return 'xs';
  if (sm.matches) return 'sm';
  if (md.matches) return 'md';
  if (lg.matches) return 'lg';
  else return 'xl';
};

export const useResponsiveSize = (sizes: ResponseConfig[]): number[] => {
  const [size, setSize] = useState(getSize());

  useEffect(() => {
    const mediaQueries = getMediaQueries();

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
