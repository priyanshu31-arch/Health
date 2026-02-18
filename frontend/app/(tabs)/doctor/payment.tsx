import { useRouter } from 'expo-router';
import PaymentScreen from '@/components/doctor/payment-screen';

export default function PaymentRoute() {
    const router = useRouter();

    const mockNavigation = {
        navigate: (screen: string) => {
            if (screen === 'BookingConfirm') router.push('/doctor/confirm' as any);
        },
        goBack: () => router.back(),
    };

    return <PaymentScreen navigation={mockNavigation as any} />;
}
