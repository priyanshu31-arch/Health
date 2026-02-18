import { useRouter } from 'expo-router';
import BookingConfirmScreen from '@/components/doctor/booking-confirm-screen';

export default function ConfirmRoute() {
    const router = useRouter();

    const mockNavigation = {
        navigate: (screen: string) => {
            if (screen === 'Home') router.push('/(tabs)' as any);
        },
        goBack: () => router.back(),
        replace: (screen: string) => {
            if (screen === 'Home') router.replace('/(tabs)' as any);
        }
    };

    return <BookingConfirmScreen navigation={mockNavigation as any} />;
}
