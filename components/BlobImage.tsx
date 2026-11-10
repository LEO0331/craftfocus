import { useEffect, useState } from 'react';
import { Image, type ImageProps } from 'react-native';

export function BlobImage({ blob, ...props }: Omit<ImageProps, 'source'> & { blob: Blob }) {
  const [uri, setUri] = useState<string>();

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUri(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return uri ? <Image {...props} source={{ uri }} /> : null;
}
