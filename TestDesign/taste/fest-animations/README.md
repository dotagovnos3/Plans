# Fest-Animations - Премиум анимации для fest-app

Библиотека wow-эффектов и плавных анимаций для React Native Expo проекта fest-app.

## 🚀 Установка

Установленные зависимости:
```bash
npm install react-native-reanimated react-native-gesture-handler
```

Добавь в `babel.config.js`:
```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: ['react-native-reanimated/plugin'],
};
```

## 📦 Структура

```
fest-animations/
├── index.ts                          # Главный экспорт
├── AnimatedPressable.tsx            # Кнопки с spring-фидбеком
├── AnimatedCard.tsx                 # Карточки с staggered entry
├── AnimatedHeader.tsx               # Анимированные заголовки
├── AnimatedChip.tsx                 # Чипы с цветовыми переходами
├── AnimatedTabs.tsx                 # Табы с индикатором
├── AnimatedFloatingButton.tsx       # FAB с glow-эффектом
├── AnimatedBadge.tsx                # Бейджи с pulse
├── AnimatedNotificationBell.tsx     # Колокольчик с bounce
├── SpringFadeIn.tsx                 # Fade-in с spring
├── GlassmorphismCard.tsx            # Стекло-морфизм
├── ParallaxScroll.tsx               # Параллакс скролл
├── AnimatedModal.tsx                # Модальные окна
├── BreathingGlow.tsx                # Пульсирующее свечение
├── AnimatedConfetti.tsx             # Конфетти
├── AnimatedCounter.tsx              # Счётчик с анимацией
├── AnimatedRipple.tsx               # Ripple эффект
├── AnimatedImage.tsx                # Картинки с shimmer
├── Skeleton.tsx                     # Скелетоны
├── screens/
│   ├── HomeScreenAnimated.tsx       # Анимированный Home
│   └── PlanDetailsScreenAnimated.tsx # Анимированный PlanDetails
```

## 🎨 Использование

### 1. Замена экранов

Просто импортируй анимированные версии экранов вместо оригинальных:

```typescript
// Вместо:
import { HomeScreen } from './screens/HomeScreen';

// Используй:
import { HomeScreenAnimated } from './fest-animations/screens/HomeScreenAnimated';
```

### 2. Использование отдельных компонентов

```typescript
import { 
  AnimatedPressable, 
  AnimatedCard, 
  SpringFadeIn,
  AnimatedBadge,
  Skeleton 
} from './fest-animations';

// Кнопка с spring-фидбеком
<AnimatedPressable onPress={handlePress} activeScale={0.96}>
  <Text>Нажми меня</Text>
</AnimatedPressable>

// Карточка с staggered entry
<AnimatedCard index={0} staggerDelay={80} enableHover enableSpotlight>
  <Text>Содержимое</Text>
</AnimatedCard>

// Fade-in анимация
<SpringFadeIn delay={200} direction="up">
  <Text>Появляюсь плавно!</Text>
</SpringFadeIn>

// Бейдж с пульсацией
<AnimatedBadge label="Иду" color={theme.colors.success} pulse />

// Скелетон загрузки
<Skeleton width={200} height={20} />
```

### 3. Staggered List (каскадная анимация списка)

```typescript
import { StaggeredList } from './fest-animations';

<StaggeredList
  data={events}
  staggerDelay={60}
  animationType="slideUp"
  renderItem={({ item, index }) => (
    <EventCard event={item} />
  )}
/>
```

### 4. Glassmorphism эффект

```typescript
import { GlassmorphismCard } from './fest-animations';

<GlassmorphismCard intensity={0.15} blur={20}>
  <Text>Стеклянная карточка</Text>
</GlassmorphismCard>
```

### 5. Parallax Scroll

```typescript
import { ParallaxScroll } from './fest-animations';

<ParallaxScroll
  headerHeight={250}
  headerComponent={<HeroImage />}
>
  <Content />
</ParallaxScroll>
```

## 🎯 Принципы анимаций

### Spring Physics
Все анимации используют spring-физику для естественного движения:
```typescript
withSpring(value, { 
  damping: 15,      // Затухание (меньше = больше пружинность)
  stiffness: 400,   // Жесткость (больше = быстрее)
  mass: 0.8         // Масса (больше = медленнее)
})
```

### Staggered Entry
Каскадное появление элементов с задержкой:
```typescript
entryProgress.value = withDelay(
  index * 80, // Задержка на основе индекса
  withSpring(1, springConfig)
);
```

### Micro-interactions
Фидбек при нажатии:
- Scale: 0.96 при нажатии
- Spring возврат при отпускании
- Hover подъем на 4-6px

## 🎬 Типы анимаций

| Компонент | Эффект |
|-----------|--------|
| AnimatedCard | Staggered entry, hover lift, spotlight |
| AnimatedPressable | Spring scale feedback |
| AnimatedHeader | Slide-in, letter-spacing animation |
| AnimatedChip | Color interpolation, shadow pulse |
| AnimatedTabs | Sliding indicator |
| AnimatedBadge | Entry scale, continuous pulse |
| NotificationBell | Bell wiggle, badge bounce |
| SpringFadeIn | Directional slide + fade |
| Confetti | Particle explosion |
| Counter | Number spring animation |

## ⚙️ Кастомизация

### Настройка spring:
```typescript
<AnimatedPressable
  springConfig={{ 
    damping: 20, 
    stiffness: 300, 
    mass: 1 
  }}
>
```

### Настройка stagger:
```typescript
<AnimatedCard
  index={index}
  staggerDelay={100} // Медленнее
  enableHover={true}
  enableSpotlight={true}
  spotlightColor="#FF6B6B"
/>
```

## 🔧 Интеграция в fest-app

### Шаг 1: Добавь babel plugin
```javascript
// babel.config.js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: ['react-native-reanimated/plugin'],
};
```

### Шаг 2: Очисти кэш
```bash
npx expo start --clear
```

### Шаг 3: Импортируй компоненты
```typescript
import { AnimatedCard, AnimatedPressable } from './fest-animations';
```

## 💡 Лучшие практики

1. **Stagger delay** — используй 60-80ms между элементами
2. **Spring damping** — 14-20 для UI, 8-12 для игровых эффектов
3. **Hover эффекты** — поднимай на 4-8px, scale 1.01-1.03
4. **Shadow** — увеличивай opacity при hover с 0.06 до 0.12-0.15
5. **Entry animation** — всегда используй отдельную ось (translateY/translateX)

## 🎨 Цветовые акценты

Используй цвета из темы fest-app:
- `theme.colors.primary` — #6C5CE7
- `theme.colors.accent` — #FD79A8  
- `theme.colors.success` — #00B894
- `theme.colors.going/thinking/cant` — статусы

## 📱 Совместимость

- iOS: Полная поддержка
- Android: Полная поддержка  
- Web: Полная поддержка (backdrop-filter для glassmorphism)

## 🎉 Готово!

Все анимации готовы к использованию! Просто импортируй и наслаждайся wow-эффектами!
