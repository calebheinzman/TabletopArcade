import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

const RouterBackButton = () => {
  const router = useRouter();

  return (
    <Button onClick={() => router.back()} size="sm">
      Back
    </Button>
  );
};

export default RouterBackButton;
