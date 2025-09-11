import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './home'; // Assuming HomeScreen is the main component for the Home tab
import ProfileScreen from './profile'; // Import your Profile screen

const Tab = createBottomTabNavigator();

export default function HomeTabNavigator() {
    return (
        <Tab.Navigator>
            <Tab.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ headerShown: false }} 
            />
            <Tab.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ headerShown: false }} 
            />
           
        </Tab.Navigator>
    );
}