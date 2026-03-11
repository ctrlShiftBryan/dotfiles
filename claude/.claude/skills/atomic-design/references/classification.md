# Classification Guide — Edge Cases

When the decision flowchart isn't enough, use these detailed examples and rules.

## Atoms

**Always atoms:**
- Button, IconButton, FAB
- TextInput, Checkbox, RadioButton, Switch, Slider
- Text, Heading, Label, Caption
- Icon, Avatar, Badge, Chip/Tag
- Separator, Divider, Spacer
- Image (plain), Skeleton/Shimmer
- Spinner/ActivityIndicator

**Atom test:** It renders a single visual element. It may accept children (like `<Text>`) but those children are content, not composed components.

**NOT atoms:**
- A `Card` with action buttons and content sections → organism
- An `Input` with built-in label and error message → molecule (FormField)
- A `Button` that fetches data on press → needs refactoring (atom + hook)

## Molecules

**Classic molecules:**
- SearchBar = Input + Button (or Input + Icon)
- FormField = Label + Input + ErrorText
- NavItem = Icon + Text (or Icon + Badge)
- AvatarGroup = multiple Avatars
- LabeledValue = Label + Text (for display fields)
- Breadcrumb = list of links + separators
- Pagination = buttons + text
- Tooltip = trigger element + tooltip content

**Molecule test:** 2-3 atoms working together for ONE purpose. If it does more than one thing, it's an organism.

**Tricky cases:**
- `DropdownMenu` — atom if it's just the trigger+menu primitive. Molecule if it composes Input + Menu. Organism if it has search, sections, multi-select.
- `Modal` — the shell/overlay is an atom. `ConfirmModal` (title + message + buttons) is a molecule. `EditProfileModal` is an organism.

## Organisms

**Classic organisms:**
- Header (logo + nav items + user menu)
- Sidebar (nav sections + user info)
- LoginForm (multiple form fields + submit + links)
- ProductCard (image + title + price + actions + rating)
- CommentThread (comment list + reply form)
- DataTable (headers + rows + pagination + sorting)
- UserProfile (avatar + info + stats + actions)

**Organism test:** It's a recognizable, self-contained section of a page. You could point at a screenshot and say "that's the header" or "that's the product card."

**Organism vs molecule gray zone:**
- < 3 composed elements doing one thing → molecule
- 4+ composed elements OR multiple concerns → organism
- Has its own state management → organism
- Appears as a distinct section with a clear boundary → organism

## Templates

Templates are the most misunderstood level. They are NOT:
- Page components with data
- Route files
- Wrapper components

**Templates ARE:**
- Layout definitions with named slots/zones
- Used by `_layout.tsx` files (Expo) or layout components (Next.js)
- Reusable across multiple pages

**Examples:**
```tsx
// components/templates/dashboard-layout.tsx — TEMPLATE
export function DashboardLayout({ sidebar, header, content }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>{header}</View>
      <View style={styles.body}>
        <View style={styles.sidebar}>{sidebar}</View>
        <View style={styles.content}>{content}</View>
      </View>
    </View>
  );
}

// components/templates/auth-layout.tsx — TEMPLATE
export function AuthLayout({ children }) {
  return (
    <View style={styles.center}>
      <Logo />
      <View style={styles.card}>{children}</View>
    </View>
  );
}
```

**Template test:** "If I replace all the content with gray boxes, does the structure still make sense?"

## Pages

In modern React frameworks, pages = route files. Period.

- **Expo Router:** `app/**/*.tsx` files
- **Next.js:** `app/**/page.tsx` or `pages/**/*.tsx`
- **React Router:** route components in your router config

**Pages should be thin.** They compose organisms/templates and connect data:

```tsx
// app/(tabs)/home.tsx — PAGE (thin)
export default function HomeScreen() {
  return (
    <DashboardLayout
      header={<HomeHeader />}
      content={<FeedList />}
    />
  );
}
```

## Special Cases

### Form Components
- Generic `<Input>` → atom
- `<FormField>` (label + input + error) → molecule
- `<LoginForm>` (multiple fields + validation + submit) → organism
- `<RegistrationForm>` with multiple sections → organism

### Card Components
- Base `<Card>` container → atom
- `<StatCard>` (icon + number + label) → molecule
- `<ProductCard>` (image + title + price + CTA + rating) → organism
- `<ProfileCard>` (avatar + name + bio + follow button) → organism

### Navigation
- `<NavItem>` (icon + label) → molecule
- `<TabBar>` → organism
- `<Header>` (logo + nav + user menu) → organism
- `<Sidebar>` (nav sections + footer) → organism
- `<BottomSheet>` container → atom; `<FilterBottomSheet>` with content → organism

### Icons
- Always atoms, regardless of complexity
- SVG icons, icon components, icon libraries — all atoms

### Platform-Specific Variants
- `.native.tsx` / `.web.tsx` / `.ios.tsx` / `.android.tsx` — same atomic level as the base component
- Classify by what the component DOES, not how it renders per-platform

### Wrapper / Provider Components
- `ThemeProvider`, `AuthProvider`, `QueryClientProvider` — NOT part of atomic hierarchy
- These are infrastructure, not UI components
- They live in `providers/` or at the app root level

### Compound Components
- `<Select>` + `<Select.Trigger>` + `<Select.Content>` + `<Select.Item>`
- The compound unit counts as ONE component for classification
- `Select` as a whole = molecule (composes trigger + menu atoms)
- The subcomponents (`.Trigger`, `.Item`) are internal atoms

### Screen Components
- If a component renders a "full screen" of content, it's either:
  - A **page** (if it's a route file) → lives in `app/`
  - An **organism** (if it's imported by a route) → lives in `components/sections/` or `features/*/components/`
- NEVER classify a screen as an atom or molecule
