import { toast as hotToast } from 'sonner';

type ToastProps = {
          title?: string;
          description?: string;
          variant?: 'default' | 'destructive';
};

export const useToast = () => {
          const toast = ({ title, description, variant }: ToastProps) => {
                    if (variant === 'destructive') {
                              hotToast.error(title || 'Error', {
                                        description,
                              });
                    } else {
                              hotToast.success(title || 'Success', {
                                        description,
                              });
                    }
          };

          return { toast };
};
