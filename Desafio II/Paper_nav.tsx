import 'react-native-gesture-handler';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';

// Importa os Tipos de Navegação
import {
  NavigationContainer,
  DrawerActions,
  DefaultTheme as NavLight,
  DrawerNavigationState,
  NavigationProp,
  ParamListBase,
  RouteProp,
} from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Provider as PaperProvider,
  MD3LightTheme,
  Appbar,
  Text,
  Button,
  Card,
  ActivityIndicator,
  Avatar,
  IconButton,
  Icon,
} from 'react-native-paper';

// --- Tipos de Dados da API ---
type Film = {
  id: string;
  title: string;
  description: string;
  director: string;
  producer: string;
  release_date: string;
  rt_score?: string;
};

// --- Tipos de Navegação ---

// Tipagem para as Telas do Drawer (Nível Superior)
type RootDrawerParamList = {
  Principal: undefined;
  Sobre: undefined;
};

// Tipagem para as Telas do Stack (Nível de Roteamento Principal)
type RootStackParamList = {
  Tabs: undefined;
  Detalhes: { film?: Film; from?: string } | undefined;
};

// Tipagem para as Telas do Tab (Nível de Abas)
type RootTabParamList = {
  Home: undefined;
  Filmes: undefined;
};

// Tipagem dos Props para os componentes
type TabsScreenProps = NativeStackScreenProps<RootStackParamList, 'Tabs'>;
type DetalhesScreenProps = NativeStackScreenProps<RootStackParamList, 'Detalhes'>;
type FilmesScreenProps = NativeStackScreenProps<RootStackParamList> & {
    navigation: NavigationProp<RootStackParamList>;
};
type SobreScreenProps = DrawerContentComponentProps;


const Drawer = createDrawerNavigator<RootDrawerParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<RootTabParamList>();

// --- Configurações de Tema ---

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: '#FAFAFA',
    surface: '#FFFFFF',
  },
};

const navTheme = {
  ...NavLight,
  colors: {
    ...NavLight.colors,
    background: '#FAFAFA',
    card: '#FFFFFF',
    text: '#1F2937',
    border: '#E5E7EB',
  },
};

// --- Componentes de Estrutura ---

// Tipagem explícita para navigation
function Header({ title, navigation }: { title: string, navigation: NavigationProp<ParamListBase> }) {
  return (
    <Appbar.Header mode="center-aligned">
      {/* Use DrawerActions.toggleDrawer() para abrir/fechar */}
      <Appbar.Action icon="menu" onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} />
      <Appbar.Content title={title} />
    </Appbar.Header>
  );
}

function ScreenContainer({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

// --- Home (static) ---
function HomeScreen({ navigation }: TabsScreenProps) {
  return (
    <ScreenContainer>
      <Card mode="elevated">
        <Card.Title
          title="Home"
          left={(props) => <Avatar.Icon {...props} icon="home" />}
        />
        <Card.Content>
          <Text>Bem-vindo! Use a aba "Filmes" para ver dados consumidos de uma API pública (Ghibli API).</Text>
        </Card.Content>
        <Card.Actions>
          {/* Navega dentro da Stack, mas passa um parâmetro vazio */}
          <Button mode="contained" onPress={() => navigation.navigate('Detalhes', { from: 'Home' })}>
            Ir para Detalhes
          </Button>
        </Card.Actions>
      </Card>
    </ScreenContainer>
  );
}

// --- Filmes: Consome API e mostra lista ---
function FilmesScreen({ navigation }: FilmesScreenProps) {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const API = 'https://ghibliapi.vercel.app/films';

  async function fetchFilms() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data: Film[] = await res.json(); // Tipando o resultado da API
      setFilms(data);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFilms();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFilms();
    setRefreshing(false);
  };

  // Tipando o parâmetro 'item'
  function renderItem({ item }: { item: Film }) {
    return (
      <Card 
        style={styles.card} 
        mode="elevated" 
        onPress={() => navigation.navigate('Detalhes', { film: item, from: 'Filmes' })} // Navega e passa o objeto
      >
        <Card.Title
          title={item.title}
          subtitle={`${item.release_date} • Dir: ${item.director}`}
          left={(p) => <Avatar.Text {...p} label={item.title.slice(0, 1)} />}
          // Corrigido para usar IconButton em vez de Icon, pois Avatar.Icon já faz isso
          right={(p) => (
            <IconButton {...p} icon="chevron-right" />
          )}
        />
        <Card.Content>
          <Text numberOfLines={3}>{item.description}</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <ScreenContainer>
      <Card mode="elevated" style={{ marginBottom: 16 }}>
        <Card.Title title="Filmes do Studio Ghibli" left={(p) => <Avatar.Icon {...p} icon="movie" />} />
      </Card>

      {loading && <ActivityIndicator animating size="large" style={{ marginVertical: 16 }} />}
      {error && <Text style={{ color: 'red', marginTop: 16 }}>Erro ao carregar dados: {error}</Text>}

      {!loading && !error && (
        <FlatList
          data={films}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          // Ocupa o espaço restante
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </ScreenContainer>
  );
}

// --- Tabs ---
function TabsScreen() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({ // 'route' é tipado automaticamente aqui
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarStyle: { backgroundColor: '#FFFFFF' },
        tabBarIcon: ({ color, size }) => { // 'color' e 'size' são tipados automaticamente
          const iconName = route.name === 'Home' ? 'home' : 'movie';
          return <Icon source={iconName} size={size} color={color} />; // Use Icon do Paper
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Filmes" component={FilmesScreen} />
    </Tabs.Navigator>
  );
}

// --- Detalhes (show film details if provided) ---
function DetalhesScreen({ route, navigation }: DetalhesScreenProps) {
  // 'film' é lido do parâmetro tipado
  const film: Film | undefined = route.params?.film;
  const from = route.params?.from ?? '—';

  return (
    <>
      <Header title="Detalhes" navigation={navigation} />
      <ScreenContainer>
        <Card>
          <Card.Title
            title={film?.title ?? 'Tela de Detalhes'}
            left={(p) => <Avatar.Text {...p} label={film?.title?.slice(0, 1) ?? '?'} />}
          />
          <Card.Content>
            {film ? (
              <>
                <Text variant="titleMedium">{film.title} ({film.release_date})</Text>
                <Text style={{ marginTop: 8 }}>{film.description}</Text>
                <Text style={{ marginTop: 12 }}>Diretor: {film.director}</Text>
                <Text>Produtor: {film.producer}</Text>
                {film.rt_score && <Text>Score: {film.rt_score}</Text>}
              </>
            ) : (
              <Text>Você veio de: {from}</Text>
            )}
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.goBack()}>Voltar</Button>
          </Card.Actions>
        </Card>
      </ScreenContainer>
    </>
  );
}

function StackPrincipal({ navigation }: any) {
  // A tipagem 'any' em StackPrincipal é mantida por simplicidade,
  // mas idealmente deveria ser: type StackPrincipalProps = DrawerScreenProps<RootDrawerParamList, 'Principal'>
  return (
    <>
      <Header title="Principal" navigation={navigation} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabsScreen} />
        <Stack.Screen name="Detalhes" component={DetalhesScreen} />
      </Stack.Navigator>
    </>
  );
}

function SobreScreen({ navigation }: SobreScreenProps) {
  // Navigation aqui vem do Drawer, mas o tipo 'DrawerContentComponentProps' abrange o necessário
  return (
    <>
      <Header title="Sobre" navigation={navigation} />
      <ScreenContainer>
        <Card>
          <Card.Title title="Sobre o App" left={(p) => <Avatar.Icon {...p} icon="information" />} />
          <Card.Content>
            <Text>Exemplo simples com Paper + Drawer + Tabs + Stack. Consome dados da Ghibli API (https://ghibliapi.vercel.app/films).</Text>
          </Card.Content>
        </Card>
      </ScreenContainer>
    </>
  );
}

export default function App() {
  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navTheme}>
        <Drawer.Navigator
          screenOptions={{
            headerShown: false,
            drawerActiveTintColor: '#2563EB',
            drawerStyle: { backgroundColor: '#FFFFFF' },
          }}
        >
          <Drawer.Screen
            name="Principal"
            component={StackPrincipal}
            options={{ drawerIcon: ({ color, size }) => <Avatar.Icon size={size} icon="view-dashboard" color={color} /> }}
          />
          <Drawer.Screen
            name="Sobre"
            component={SobreScreen}
            options={{ drawerIcon: ({ color, size }) => <Avatar.Icon size={size} icon="information-outline" color={color} /> }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FAFAFA',
    justifyContent: 'flex-start',
  },
  card: {
    marginVertical: 4,
    borderRadius: 8,
  },
});