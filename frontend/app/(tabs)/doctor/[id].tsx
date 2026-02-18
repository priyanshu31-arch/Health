import { useLocalSearchParams, useRouter } from 'expo-router';
import DoctorInfoScreen from '@/components/doctor/doctor-info';

export default function DoctorInfoRoute() {
    const { id, name, specialization, rating, image } = useLocalSearchParams();
    const router = useRouter();

    // We can pass these to the component or make the component fetch by ID
    // For now, let's just use the existing component and mock the navigation prop
    const mockNavigation = {
        navigate: (screen: string) => {
            if (screen === 'Payment') router.push('/doctor/payment' as any);
        },
        goBack: () => router.back(),
    };

    return <DoctorInfoScreen navigation={mockNavigation as any} doctorData={{ id, name, specialization, rating, image }} />;
}
