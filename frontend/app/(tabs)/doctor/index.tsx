import DoctorTabScreen from '@/components/doctor/doctor-filter-screen';
import { useRouter } from 'expo-router';

export default function DoctorFilterRoute() {
    const router = useRouter();

    const mockNavigation = {
        navigate: (screen: string, params?: any) => {
            if (screen === 'DoctorInfo' && params?.id) {
                router.push({
                    pathname: `/doctor/${params.id}`,
                    params: params
                } as any);
            }
        },
        goBack: () => router.back(),
    };

    return <DoctorTabScreen navigation={mockNavigation as any} />;
}
