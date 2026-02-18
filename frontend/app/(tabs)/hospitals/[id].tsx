import { useLocalSearchParams, useRouter } from 'expo-router';
import HospitalInfoScreen from '@/components/hospital/hospital-info';

export default function HospitalInfoRoute() {
    const { id, name, location, rating } = useLocalSearchParams();
    const router = useRouter();

    const mockNavigation = {
        navigate: (screen: string, params: any) => {
            // Handle navigation to enquiry or other screens if needed
            if (screen === 'Enquiry') {
                router.push({ pathname: '/hospitals/hospital-enquiry' as any, params });
            }
        },
        goBack: () => router.back(),
    };

    const hospitalData = { id, name, location, rating };

    return <HospitalInfoScreen navigation={mockNavigation as any} hospitalData={hospitalData} />;
}
