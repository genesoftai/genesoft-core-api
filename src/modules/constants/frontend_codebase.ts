export const InitialCodebaseUnderstandingForNextjsProject = `
Codebase Understanding for Next.js 15 App Router Project
# --- Global Configuration & Setup ---
global_config:
  next_config_js:
    key_settings:
      - setting: output: 'standalone'
        purpose: Optimizes for Docker deployment.
      - setting: experimental.serverActions: true
        purpose: Enables Server Actions feature.
    location: next.config.ts
  tailwind_config_js:
    key_settings:
      - setting: theme.extend.colors
        purpose: Defines custom color palette for the application.
      - setting: plugins
        purpose: Includes additional Tailwind plugins.
    location: tailwind.config.ts
  tsconfig_json:
    key_settings:
      - setting: paths
        purpose: Defines module path aliases (e.g., @/components).
      - setting: strict
        purpose: Enforces strict TypeScript type checking.
    location: tsconfig.json
  package_json:
    purpose: Project dependencies and scripts.
    location: package.json
  environment_variables:
    purpose: Environment variables example for the project.
    location: .env.example
  global_css:
      purpose: Base styles, Tailwind directives, and global utility classes.
      location: src/app/globals.css

# --- Documentation ---
documentation:
  - location: README.md
    purpose: Project overview and setup instructions.
  - location: api_docs.md
    purpose: API documentation.

# --- Routes (Pages & Layouts) ---
routes:
  - path: / # Homepage
    purpose: Main landing page.
    layout:
      file: app/(home)/layout.tsx
      purpose: Layout specific to home/public pages.
      location: src/app/(home)/layout.tsx
    page:
      file: app/(home)/page.tsx
      location: src/app/(home)/page.tsx
      rendering: Static
      components:
        - name: Various landing page components
          purpose: Display marketing content, features, etc.
          

# --- API Routes ---
api_routes:
  - path: /api/user/email/[email]
    method: Multiple
    file: app/api/user/email/[email]/route.ts
    location: src/app/api/user/email/[email]/route.ts
    purpose: User-related operations by email.

# --- Shared Components ---
shared_components:
  # UI Components (shadcn/ui)
  - name: Accordion
    location: src/components/ui/accordion.tsx
    purpose: Vertically collapsible content panels.

  - name: AlertDialog
    location: src/components/ui/alert-dialog.tsx
    purpose: Modal dialog for important alerts requiring user attention.

  - name: Alert
    location: src/components/ui/alert.tsx
    purpose: Displays important messages to users.

  - name: AspectRatio
    location: src/components/ui/aspect-ratio.tsx
    purpose: Maintains consistent width-to-height ratio.

  - name: Avatar
    location: src/components/ui/avatar.tsx
    purpose: User profile picture component.

  - name: Badge
    location: src/components/ui/badge.tsx
    purpose: Small status descriptor for UI elements.

  - name: Breadcrumb
    location: src/components/ui/breadcrumb.tsx
    purpose: Navigation aid showing hierarchical path.

  - name: Button
    location: src/components/ui/button.tsx
    purpose: Standard button element with variants.

  - name: Calendar
    location: src/components/ui/calendar.tsx
    purpose: Date picker component.

  - name: Card
    location: src/components/ui/card.tsx
    purpose: Content container with standard styling.

  - name: Carousel
    location: src/components/ui/carousel.tsx
    purpose: Slideshow component for cycling through elements.

  - name: Chart
    location: src/components/ui/chart.tsx
    purpose: Data visualization component.

  - name: Checkbox
    location: src/components/ui/checkbox.tsx
    purpose: Form input for selecting options.

  - name: Collapsible
    location: src/components/ui/collapsible.tsx
    purpose: Toggle visibility of content.

  - name: Command
    location: src/components/ui/command.tsx
    purpose: Command palette for keyboard navigation.

  - name: ContextMenu
    location: src/components/ui/context-menu.tsx
    purpose: Right-click menu component.

  - name: Dialog
    location: src/components/ui/dialog.tsx
    purpose: Modal dialog component.

  - name: Drawer
    location: src/components/ui/drawer.tsx
    purpose: Side panel that slides in from screen edge.

  - name: DropdownMenu
    location: src/components/ui/dropdown-menu.tsx
    purpose: Menu displayed on user interaction.

  - name: Form
    location: src/components/ui/form.tsx
    purpose: Form handling component.

  - name: HoverCard
    location: src/components/ui/hover-card.tsx
    purpose: Card displayed on hover.

  - name: InputOTP
    location: src/components/ui/input-otp.tsx
    purpose: One-time password input field.

  - name: Input
    location: src/components/ui/input.tsx
    purpose: Standard text input field.

  - name: Label
    location: src/components/ui/label.tsx
    purpose: Form field label component.

  - name: Menubar
    location: src/components/ui/menubar.tsx
    purpose: Horizontal menu with dropdown items.

  - name: NavigationMenu
    location: src/components/ui/navigation-menu.tsx
    purpose: Hierarchical navigation component.

  - name: Pagination
    location: src/components/ui/pagination.tsx
    purpose: Controls for navigating paginated content.

  - name: Popover
    location: src/components/ui/popover.tsx
    purpose: Floating content triggered by user interaction.

  - name: Progress
    location: src/components/ui/progress.tsx
    purpose: Visual indicator of task completion.

  - name: RadioGroup
    location: src/components/ui/radio-group.tsx
    purpose: Group of radio buttons for selecting one option.

  - name: Resizable
    location: src/components/ui/resizable.tsx
    purpose: Component that can be resized by user.

  - name: ScrollArea
    location: src/components/ui/scroll-area.tsx
    purpose: Custom scrollable container.

  - name: Select
    location: src/components/ui/select.tsx
    purpose: Dropdown selection component.

  - name: Separator
    location: src/components/ui/separator.tsx
    purpose: Visual divider between content.

  - name: Sheet
    location: src/components/ui/sheet.tsx
    purpose: Side panel component.

  - name: Sidebar
    location: src/components/ui/sidebar.tsx
    purpose: Navigation sidebar component.

  - name: Skeleton
    location: src/components/ui/skeleton.tsx
    purpose: Loading placeholder component.

  - name: Slider
    location: src/components/ui/slider.tsx
    purpose: Range selection component.

  - name: Sonner
    location: src/components/ui/sonner.tsx
    purpose: Toast notification wrapper.

  - name: Switch
    location: src/components/ui/switch.tsx
    purpose: Toggle switch component.

  - name: Table
    location: src/components/ui/table.tsx
    purpose: Data table component.

  - name: Tabs
    location: src/components/ui/tabs.tsx
    purpose: Tabbed interface component.

  - name: Textarea
    location: src/components/ui/textarea.tsx
    purpose: Multi-line text input.

  - name: Toast
    location: src/components/ui/toast.tsx
    purpose: Notification component.

  - name: Toaster
    location: src/components/ui/toaster.tsx
    purpose: Toast notification container.

  - name: ToggleGroup
    location: src/components/ui/toggle-group.tsx
    purpose: Group of toggle buttons.

  - name: Toggle
    location: src/components/ui/toggle.tsx
    purpose: Two-state button component.

  - name: Tooltip
    location: src/components/ui/tooltip.tsx
    purpose: Informational popup on hover.

# --- Constants & Configuration ---
constants:
  - location: src/constants/api-service/url.ts
    purpose: API endpoint services URL.

  - location: src/constants/api-service/authorization.ts
    purpose: Authorization-related constants for calling Core API service.

  - location: src/constants/web.ts
    purpose: Web application constants.

# --- Utilities & Helpers ---
utilities:
  - location: src/lib/utils.ts
    purpose: General utility functions.

  - location: src/utils/validation.ts
    purpose: Form and data validation helpers.

# --- Authentication ---
authentication:
  strategy: Likely using NextAuth or 3rd party auth service (based on auth callback route)
  flows:
    - signin: Standard email/password
    - signup: New user registration
    - reset-password: Password recovery flow

# --- Public Assets ---
public_assets:
  - location: public/file.svg
    purpose: File icon for the application.
  - location: public/globe.svg
    purpose: Globe icon for the application.
  - location: public/next.svg
    purpose: Next.js logo.
  - location: public/vercel.svg
    purpose: Vercel logo.
  - location: public/window.svg
    purpose: Window icon for the application.
`;
