# AppBooking

A booking app: people pick a service, a person and a free time, book and get a confirmation; the business sees its calendar and manages hours and bookings.

| | |
| --- | --- |
| Group | Apps |
| Example product | Lantern Salon bookings (appointments with a calendar) |
| Blocks | ActivityFeed, Agenda, AvatarGroup, ConfirmDialog, DataTable, DatePicker, DetailView, EditForm, EmptyState, ListSearch, LogIn, OrderConfirmation, OrderHistory, ProductGrid, SettingsPage, SidePanel, Stepper, Tabs, TimePicker, Toasts, TopBar |
| Packages | Web app (full stack). Free times are shared between everyone booking, so it needs a server. |
| Related | AppCrm (clients), AppAdmin (the business side shell) |

## Screens

| Screen | Route | Blocks |
| --- | --- | --- |
| Services | `/` | TopBar, ProductGrid, ListSearch |
| Choose a time | `/book/{service}` | DatePicker, TimePicker, AvatarGroup, Stepper |
| Your details | `/book/{service}/details` | EditForm, Stepper, LogIn |
| Booked | `/bookings/{id}` | OrderConfirmation, Toasts |
| My bookings | `/me/bookings` | OrderHistory, ConfirmDialog, EmptyState |
| Calendar (staff) | `/admin/calendar` | SidePanel, Agenda, Tabs, DetailView |
| Hours and services (staff) | `/admin/settings` | SettingsPage, EditForm, TimePicker, DataTable |
| Clients (staff) | `/admin/clients` | DataTable, DetailView, ActivityFeed |

## Navigation

- Public side: TopBar with the business name, Services, My bookings, the language switch. Booking is a 3-step flow (Stepper: Time · Details · Done) with Back on each step.
- Staff side (`/admin`): SidePanel Calendar · Clients · Hours and services · Settings. Calendar has Tabs Day · Week · List.
- Phone: BottomBar for staff (Calendar · Clients · Settings); the public side is one column with no BottomBar.

## Journeys

The first word of each step is the screen; the blocks named are the cards to copy.

**Book an appointment**

1. Services: pick "Haircut and wash"
2. Choose a time: DatePicker day, TimePicker slot (taken slots disabled with their reason)
3. Your details: EditForm name, phone, email, a note; or LogIn to fill them
4. Booked: OrderConfirmation with Add to Calendar (.ics) and Change or Cancel

**Cancel**

1. My bookings: OrderHistory, Cancel (ConfirmDialog says the cancellation rule)
2. My bookings: Toasts "Booking cancelled"; the slot is free again

**Staff day**

1. Calendar (staff): Agenda Day view of bookings by staff member
2. Calendar (staff): DetailView of a booking, Mark as Done or No-show

## Phone

- Day buttons in one row of 5 with ‹ › for other weeks; time slots in 3 columns of 44 px buttons; the summary moves under the slots with the Book button full width.
- Staff calendar shows the List view by default on the phone (Agenda), Day/Week in Tabs.

## Data model

| Table | Fields |
| --- | --- |
| `services` | id, name_en, name_ja, minutes, price_yen, active |
| `staff` | id, name, services (ids), photo |
| `hours` | staff_id, weekday (0–6), opens, closes · `time_off`: staff_id, starts_at, ends_at, reason |
| `bookings` | id, service_id, staff_id, client_id, starts_at, ends_at, status (booked · done · no_show · cancelled), note, created_at |
| `clients` | id, name, phone, email, notes |

A slot is free when it is inside `hours`, outside `time_off`, and overlaps no `booked` booking for that staff member. The server checks again on Book (409 Conflict → "That time was just taken. Choose another.").

## Capabilities and packages

Capabilities: **Database**, **Log in and accounts** (staff; clients optional), **Admin pages**, **Installs on a phone** (staff). Package: **Web app (full stack)**. Reminders by email need an email provider (the person's choice).

## Texts

App-level keys only; each block brings its own.

| Key | English | 日本語 |
| --- | --- | --- |
| `app.name` | Lantern Salon | ランタンサロン |
| `nav.services` | Services | メニュー |
| `nav.my_bookings` | My Bookings | 予約の確認 |
| `staff.calendar` | Calendar | カレンダー |
| `staff.clients` | Clients | お客様 |
| `staff.hours` | Hours and Services | 営業時間とメニュー |
| `book.step_time` | Time | 日時 |
| `book.step_details` | Details | お客様情報 |
| `book.step_done` | Done | 完了 |

## Adding to it

- Classes with several seats (yoga, lessons) are the same flow with `capacity` on a slot and "3 seats left".
- **Proposed block: WeekCalendar** (a staff week grid with drag to move a booking) is not in the catalogue; Agenda's Day and List views cover the first version.
