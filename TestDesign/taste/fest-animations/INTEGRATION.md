# Интеграция Fest-Animations в fest-app

## Шаг 1: Копирование файлов

Скопируй все файлы из `fest-animations/` в `e:/FEST/V1/fest-app/src/fest-animations/`

```bash
# PowerShell
Copy-Item -Path "E:\FEST\V1\TestDesign\taste\taste-skill-main\fest-animations\*" -Destination "E:\FEST\V1\fest-app\src\fest-animations\" -Recurse -Force
```

## Шаг 2: Настройка Babel

Добавь plugin в `babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

## Шаг 3: Настройка Metro (если нужно)

Создай/обнови `metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
```

## Шаг 4: Запуск с очисткой кэша

```bash
npx expo start --clear
```

## Шаг 5: Замена компонентов

### Замена ScreenContainer (опционально)

Если нужен glassmorphism для всего экрана:

```typescript
// src/components/ScreenContainerAnimated.tsx
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export const ScreenContainerAnimated = ({ children, style }) => {
  const progress = useSharedValue(0);
  
  React.useEffect(() => {
    progress.value = withSpring(1, { damping: 14, stiffness: 200 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <Animated.View style={[s.root, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};
```

### Замена HomeScreen

```typescript
// src/screens/HomeScreen.tsx
// ЗАМЕНИ ВСЕ содержимое на импорт из fest-animations

export { HomeScreenAnimated as HomeScreen } from '../fest-animations/screens/HomeScreenAnimated';
```

### Частичная замена (безопасный вариант)

Если хочешь сохранить логику оригинального экрана, замени только UI компоненты:

```typescript
// В HomeScreen.tsx замени:

// Вместо TouchableOpacity для карточек:
import { AnimatedPressable, AnimatedCard } from '../fest-animations';

// Для карточки события:
<AnimatedCard 
  index={index} 
  enableHover 
  enableSpotlight
  onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
>
  {/* Содержимое карточки */}
</AnimatedCard>

// Для кнопок:
<AnimatedPressable 
  onPress={() => toggleInterest(item.id)}
  activeScale={0.96}
>
  <Text>интересно</Text>
</AnimatedPressable>

// Для колокольчика:
import { AnimatedNotificationBell } from '../fest-animations';
<AnimatedNotificationBell 
  count={unread} 
  onPress={() => navigation.navigate('Notifications')} 
/>

// Для чипов:
import { AnimatedChip } from '../fest-animations';
<AnimatedChip
  label={chip.label}
  active={categoryFilter === chip.key}
  onPress={() => setCategoryFilter(chip.key)}
  index={index}
/>
```

### Замена PlanDetailsScreen

```typescript
// src/screens/PlanDetailsScreen.tsx
// Частичная замена

import { 
  AnimatedPressable, 
  AnimatedBadge,
  AnimatedFloatingButton,
  SpringFadeIn 
} from '../fest-animations';

// Для статус-бейджей:
<AnimatedBadge label="Иду" color={theme.colors.going} pulse />

// Для кнопок статуса:
<AnimatedPressable
  onPress={() => handleSetStatus('going')}
  style={[s.statusBtn, myStatus === 'going' && s.statusActive]}
>
  <Text>Иду</Text>
</AnimatedPressable>

// Для FAB (floating action button):
<AnimatedFloatingButton
  label="Создать"
  onPress={handleCreate}
  icon="✨"
/>
```

### Замена CreatePlanForm

```typescript
// Для кнопки создания:
import { AnimatedFloatingButton } from '../fest-animations';

<AnimatedFloatingButton
  label="Создать план"
  onPress={handleCreate}
  variant="success"
/>

// Для полей ввода с анимацией:
<SpringFadeIn delay={index * 100}>
  <TextInput ... />
</SpringFadeIn>
```

### Замена NotificationsScreen

```typescript
// Для элементов списка:
import { StaggeredList, AnimatedCard } from '../fest-animations';

<StaggeredList
  data={notifications}
  renderItem={({ item, index }) => (
    <AnimatedCard index={index} enableHover>
      {/* Контент уведомления */}
    </AnimatedCard>
  )}
/>
```

## Шаг 6: Добавление Loading States

```typescript
// Для загрузки событий:
import { Skeleton, SkeletonCard } from '../fest-animations';

{loading ? (
  <>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </>
) : (
  <FlatList ... />
)}
```

## Шаг 7: Добавление Success Feedback

```typescript
// Для планов - конфетти при завершении:
import { AnimatedConfetti } from '../fest-animations';

const [showConfetti, setShowConfetti] = useState(false);

// При успешном действии:
const handleCompletePlan = () => {
  completePlan(planId);
  setShowConfetti(true);
};

// В JSX:
<AnimatedConfetti 
  trigger={showConfetti} 
  onComplete={() => setShowConfetti(false)} 
/>
```

## Проверка типов

```bash
cd e:/FEST/V1/fest-app
npx tsc --noEmit
```

## Готовые примеры

В `fest-animations/screens/` находятся полностью готовые анимированные версии:
- `HomeScreenAnimated.tsx` - полная замена HomeScreen
- `PlanDetailsScreenAnimated.tsx` - полная замена PlanDetailsScreen

Можно использовать их целиком или копировать части.

## Демонстрация всех эффектов

```typescript
// App.tsx или отдельный экран
import { AnimationShowcase } from './fest-animations/AnimationShowcase';

// Добавь в навигацию:
<Screen name="AnimationsDemo" component={AnimationShowcase} />
```

## Типичные проблемы и решения

### Проблема: "Reanimated 2 failed to create a worklet"

Решение: Убедись что babel plugin добавлен и выполни:
```bash
npx expo start --clear
```

### Проблема: Анимации не работают на web

Решение: Для web нужен дополнительный конфиг, но базовые анимации должны работать.

### Проблема: Типы не найдены

Решение: Убедись что путь импорта правильный:
```typescript
import { ... } from '../fest-animations';
// или
import { ... } from './fest-animations';
```

## Чеклист интеграции

- [ ] Файлы скопированы в src/fest-animations/
- [ ] Babel plugin добавлен
- [ ] Кэш очищен (npx expo start --clear)
- [ ] Импорты обновлены в HomeScreen
- [ ] Импорты обновлены в PlanDetailsScreen
- [ ] Импорты обновлены в CreatePlanForm
- [ ] Типы проверены (npx tsc --noEmit)
- [ ] Приложение запускается без ошибок
- [ ] Анимации работают плавно

## Результат

После интеграции fest-app получит:

✨ Spring-физика на всех интерактивах
✨ Staggered entry для списков
✨ Hover lift эффекты на карточках
✨ Pulse анимации для бейджей
✨ Bounce для уведомлений
✨ Color interpolation для чипов
✨ Skiding indicator для табов
✨ Confetti для успешных действий
✨ Shimmer skeleton для загрузки
✨ Glassmorphism эффекты

🎉 Все wow-эффекты готовы к использованию!
