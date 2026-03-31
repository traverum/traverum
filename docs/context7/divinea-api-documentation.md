# Divinea Wine Suite API Documentation

> **Base URL (Staging):** `https://api-crm-staging.divinea.com/api`
> **Base URL (Production):** `https://api-crm.divinea.com/api`
> **Swagger Version:** 2.0 | **API Version:** 2.0.1
> **Contact:** DIVINEA — support@divinea.com — https://divinea.com

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [API Group: OCTO (Highest Priority)](#2-api-group-octo)
   - [Availability Endpoints](#21-availability-endpoints)
   - [Supplier Endpoint](#22-supplier-endpoint)
   - [OCTO Models](#23-octo-models)
3. [API Group: Integration v2](#3-api-group-integration-v2)
   - [Reservations Endpoints](#31-reservations-endpoints)
   - [Contacts Endpoints](#32-contacts-endpoints-v2)
   - [Availability Endpoints (v2)](#33-availability-endpoints-v2)
   - [Experiences Endpoints](#34-experiences-endpoints)
   - [Orders Endpoints](#35-orders-endpoints)
   - [Winery Info Endpoint](#36-winery-info-endpoint)
   - [Closing Days Endpoints](#37-closing-days-endpoints)
   - [Low-Priority Endpoints (Minimal)](#38-low-priority-endpoints-minimal)
   - [Integration v2 Models](#39-integration-v2-models)
4. [API Group: Integration v3](#4-api-group-integration-v3)
   - [Contacts Endpoints (v3)](#41-contacts-endpoints-v3)
   - [Orders Endpoints (v3)](#42-orders-endpoints-v3)
   - [Order Import Endpoint (v3)](#43-order-import-endpoint-v3)
   - [Integration v3 Models](#44-integration-v3-models)
5. [API Group: Order Import](#5-api-group-order-import)
6. [Enum Reference](#6-enum-reference)

---

## 1. Authentication

All API groups use the same authentication mechanism.

### Required Headers

| Header Name | Type | Location | Description |
|---|---|---|---|
| `APIKey` | string | Header | API key for authentication. Required on all endpoints. |
| `Winery Id` | string | Header | Winery identifier. Used to scope requests to a specific winery. Referenced in security definitions as `X-DWS-WINERY`. |

Both are defined as `apiKey` type in the OpenAPI securityDefinitions. Every endpoint requires the `ApiKey` security scheme. Some endpoints additionally accept or require the `Winery Id` header.

**Example:**
```
POST /api/octo/availability HTTP/1.1
Host: api-crm-staging.divinea.com
APIKey: your-api-key-here
Content-Type: application/json
```

---

## 2. API Group: OCTO

**This is the highest-priority API group for Traverum integration.** It provides availability checking and supplier information using the OCTO (Open Connectivity for Tourism) standard.

Tags: `availability`, `supplier`

### 2.1 Availability Endpoints

#### 2.1.1 POST `/octo/availability` — Check Availability

Returns time-slot-level availability for a product/experience over a date range.

**Request Body:** `AvailabilityRequest` (required)

```json
{
  "productId": "string",
  "optionId": "string",
  "localDateStart": "2025-06-01",
  "localDateEnd": "2025-06-07",
  "availabilityIds": ["string"]
}
```

**Response 200:** `Array<OCTOAvailabilityDTO>`

```json
[
  {
    "id": "string",
    "available": true,
    "status": "AVAILABLE",
    "capacity": 20,
    "vacancies": 15,
    "maxUnits": 10,
    "allDay": false,
    "localDateTimeStart": "2025-06-01T10:00:00",
    "localDateTimeEnd": "2025-06-01T12:00:00",
    "utcCutoffAt": "2025-06-01T08:00:00Z",
    "openingHours": [
      { "from": "10:00", "to": "12:00" }
    ]
  }
]
```

---

#### 2.1.2 POST `/octo/availability/calendar` — Check Availability Calendar

Returns day-level availability summary (no time slots). Useful for building calendar views showing which days have availability.

**Request Body:** `AvailabilityRequest` (required)

**Response 200:** `Array<OCTOAvailabilityCalendarDTO>`

```json
[
  {
    "id": "string",
    "localDate": "2025-06-01",
    "available": true,
    "status": "AVAILABLE",
    "capacity": 20,
    "vacancies": 15,
    "openingHours": [
      { "from": "10:00", "to": "18:00" }
    ]
  }
]
```

---

#### 2.1.3 POST `/octo/availability/extended` — Check Availability Extended ⭐

**This is the richest availability endpoint.** Returns detailed slot-level data including experience metadata, room info, language settings, booking policies, and occupancy counts.

**Request Body:** `AvailabilityRequest` (required)

**Response 200:** `Array<Result>`

```json
[
  {
    "id": "string",
    "day": "2025-06-01",
    "startTime": "2025-06-01T10:00:00",
    "endTime": "2025-06-01T12:00:00",
    "time": { "hour": 10, "minute": 0, "second": 0, "nano": 0 },
    "active": true,
    "availableSeats": 15,
    "occupiedCount": 5,
    "occupiedCountAllSlot": 5,
    "maxParties": 4,
    "maxPartiesThisExperience": 2,
    "minPartiesToEnable": 1,
    "experienceId": "uuid",
    "experienceDuration": 120,
    "experience": {
      "id": "uuid",
      "title": "Wine Tasting Tour",
      "color": "#FF5733",
      "duration": 120
    },
    "room": {
      "id": "uuid",
      "name": "Main Hall",
      "capacity": 20,
      "color": "#333333"
    },
    "roomName": "Main Hall",
    "defaultLanguages": ["it", "en"],
    "enabledLanguages": ["it", "en", "de"],
    "effectPolicy": "string",
    "isEvent": false,
    "isSingleSlot": false,
    "isManuallyEdited": false,
    "isBiggerThanExperienceAntecedence": false,
    "hasautomatically_accept_reservations_on_same_slot": true,
    "hasclose_matching_slot_languages_in_the_same_experience": false,
    "hasclose_matching_slots_in_other_experiences": false,
    "hasclose_matching_slots_in_the_same_experience": false,
    "hasslot_and_room_avail_automation": true
  }
]
```

---

### 2.2 Supplier Endpoint

#### 2.2.1 GET `/octo/supplier` — Get Supplier Info

Returns supplier (winery) information. Useful for testing connectivity and verifying API key validity.

**Parameters:** None (authentication headers only)

**Response 200:** `OCTOSupplierDTO`

```json
{
  "id": "string",
  "name": "Cantina Example",
  "endpoint": "string",
  "contact": {
    "address": "Via Roma 1, 50100 Firenze",
    "email": "info@cantina.it",
    "telephone": "+39 055 1234567",
    "website": "https://www.cantina.it"
  }
}
```

---

### 2.3 OCTO Models

#### AvailabilityRequest

| Property | Type | Format | Required | Description |
|---|---|---|---|---|
| `productId` | string | — | No | Product (experience) ID to check availability for |
| `optionId` | string | — | No | Specific option within a product |
| `localDateStart` | string | `date` | No | Start date for availability range (YYYY-MM-DD) |
| `localDateEnd` | string | `date` | No | End date for availability range (YYYY-MM-DD) |
| `availabilityIds` | array[string] | — | No | Specific availability slot IDs to check |

#### OCTOAvailabilityDTO

| Property | Type | Format | Description |
|---|---|---|---|
| `id` | string | — | Unique availability slot identifier |
| `available` | boolean | — | Whether this slot is available for booking |
| `status` | string | enum | Availability status: `AVAILABLE`, `FREESALE`, `SOLD_OUT`, `LIMITED`, `CLOSED` |
| `capacity` | integer | int32 | Total capacity of this slot |
| `vacancies` | integer | int32 | Remaining available spots |
| `maxUnits` | integer | int32 | Maximum units bookable |
| `allDay` | boolean | — | Whether this is an all-day availability |
| `localDateTimeStart` | string | date-time | Slot start datetime (local timezone) |
| `localDateTimeEnd` | string | date-time | Slot end datetime (local timezone) |
| `utcCutoffAt` | string | date-time | UTC cutoff time after which booking is no longer possible |
| `openingHours` | array[OCTOOpeningHoursDTO] | — | Opening hours for this slot |

#### OCTOAvailabilityCalendarDTO

| Property | Type | Format | Description |
|---|---|---|---|
| `id` | string | — | Unique identifier |
| `localDate` | string | date | The calendar date |
| `available` | boolean | — | Whether the day has availability |
| `status` | string | enum | `AVAILABLE`, `FREESALE`, `SOLD_OUT`, `LIMITED`, `CLOSED` |
| `capacity` | integer | int32 | Total capacity for the day |
| `vacancies` | integer | int32 | Remaining spots for the day |
| `openingHours` | array[OCTOOpeningHoursDTO] | — | Opening hours |

#### OCTOOpeningHoursDTO

| Property | Type | Description |
|---|---|---|
| `from` | string | Start time (e.g. `"10:00"`) |
| `to` | string | End time (e.g. `"18:00"`) |

#### Result (Extended Availability) ⭐

The richest availability model. Contains everything needed to display slots with full context.

| Property | Type | Format | Description |
|---|---|---|---|
| `id` | string | — | Unique slot identifier |
| `day` | string | date | The date of this slot |
| `startTime` | string | date-time | Slot start datetime |
| `endTime` | string | date-time | Slot end datetime |
| `time` | LocalTime | — | Structured time object `{hour, minute, second, nano}` |
| `active` | boolean | — | Whether the slot is active/enabled |
| `availableSeats` | integer | int32 | Number of available seats |
| `occupiedCount` | integer | int32 | Number of occupied seats in this slot |
| `occupiedCountAllSlot` | integer | int32 | Total occupied across all related slots |
| `maxParties` | integer | int32 | Maximum number of parties/groups allowed |
| `maxPartiesThisExperience` | integer | int32 | Max parties for this specific experience |
| `minPartiesToEnable` | integer | int32 | Minimum parties needed to activate the slot |
| `experienceId` | string | uuid | Experience UUID |
| `experienceDuration` | integer | int32 | Duration in minutes |
| `experience` | Experience | — | Nested experience object (id, title, color, duration) |
| `room` | Room | — | Nested room object (id, name, capacity, color) |
| `roomName` | string | — | Room name (denormalized) |
| `defaultLanguages` | array[string] | — | Default languages for this slot |
| `enabledLanguages` | array[string] | — | All enabled languages |
| `effectPolicy` | string | — | Effect policy identifier |
| `isEvent` | boolean | — | Whether this is a special event |
| `isSingleSlot` | boolean | — | Whether only one slot exists for this time |
| `isManuallyEdited` | boolean | — | Whether the slot was manually edited |
| `isBiggerThanExperienceAntecedence` | boolean | — | Antecedence check flag |
| `hasautomatically_accept_reservations_on_same_slot` | boolean | — | Auto-accept reservations on same slot |
| `hasclose_matching_slot_languages_in_the_same_experience` | boolean | — | Close matching language slots in same experience |
| `hasclose_matching_slots_in_other_experiences` | boolean | — | Close matching slots across experiences |
| `hasclose_matching_slots_in_the_same_experience` | boolean | — | Close matching slots in same experience |
| `hasslot_and_room_avail_automation` | boolean | — | Slot and room availability automation enabled |

#### Experience (nested in Result)

| Property | Type | Format | Description |
|---|---|---|---|
| `id` | string | uuid | Experience UUID |
| `title` | string | — | Experience title |
| `color` | string | — | Display color (hex) |
| `duration` | integer | int32 | Duration in minutes |

#### Room (nested in Result)

| Property | Type | Format | Description |
|---|---|---|---|
| `id` | string | uuid | Room UUID |
| `name` | string | — | Room name |
| `capacity` | integer | int32 | Room capacity |
| `color` | string | — | Display color (hex) |

#### LocalTime

| Property | Type | Format |
|---|---|---|
| `hour` | integer | int32 |
| `minute` | integer | int32 |
| `second` | integer | int32 |
| `nano` | integer | int32 |

#### OCTOSupplierDTO

| Property | Type | Description |
|---|---|---|
| `id` | string | Supplier identifier |
| `name` | string | Supplier/winery name |
| `endpoint` | string | API endpoint |
| `contact` | OCTOSupplierContactDTO | Contact information |

#### OCTOSupplierContactDTO

| Property | Type | Description |
|---|---|---|
| `address` | string | Physical address |
| `email` | string | Email address |
| `telephone` | string | Phone number |
| `website` | string | Website URL |

---

## 3. API Group: Integration v2

Tags: `ReservationsAPI`, `ContactAPI`, `availability`, `ExperiencesAPI`, `OrdersAPI`, `WineryInfoAPI`, `closing-days`, `Coupons`, `GiftsAPI`, `ProductCatalogAPI`, `ProductCatalogAttributeAPI`, `ProductCatalogCategoryAPI`, `ProductCatalogProductTypeAPI`, `CustomerClassAPI`, `statistics`, `tags`, `woocommerce_v2`

### 3.1 Reservations Endpoints

#### 3.1.1 POST `/v2/reservations/integration/{reservationID}` — Create/Update Reservation ⭐

**Primary endpoint for creating and updating reservations.** Pass `"NEW"` or `null` as `reservationID` to create a new reservation.

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `reservationID` | path | string | Yes | Reservation ID, or `"NEW"` / `null` to create |
| `reservationDTO` | body | ReservationDTO | Yes | Full reservation data |

**Responses:**

| Code | Description | Schema |
|---|---|---|
| 200 | Success | `ReservationDTO` |
| 204 | No content found for these filters in your account | `ReservationDTO` |
| 404 | No action possible for reservation with id: `{reservationID}` in your account | — |
| 500 | Error not intercepted - please contact the administrator | — |

---

#### 3.1.2 PUT `/v2/reservations/import/{reservationID}` — Import/Upsert Reservation

Create or update a reservation using the simpler `ReservationInput` model. Pass `"NEW"` or `null` as `reservationID` to create.

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `reservationID` | path | string | Yes | Reservation ID, or `"NEW"` / `null` to create |
| `reservationInput` | body | ReservationInput | Yes | Reservation input data |

**Response 200:** `ReservationUpsertMainCommandResponse`

---

#### 3.1.3 GET `/v2/reservations/{reservationID}` — Get Reservation by ID

Retrieve a single reservation by its ID.

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `reservationID` | path | string | Yes |

**Response 200:** `ReservationDTO`

---

#### 3.1.4 GET `/v2/reservations/multiple` — Get Multiple Reservations

Retrieve multiple reservations by their IDs.

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `ids` | query | array[string] | Yes | Comma-separated reservation IDs |

**Response 200:** `Array<ReservationDTO>`

---

#### 3.1.5 POST `/v2/reservations/query` — Query Reservations

Retrieve reservations matching a filter.

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `filter` | body | Filter | Yes | Filter criteria |
| `lang` | query | string | No | Language code |

**Response 200:** `Array<ReservationDTO>`

---

#### 3.1.6 PUT `/v2/reservations/{reservationID}/confirm` — Confirm Reservation ⭐

Confirm a reservation (typically after payment).

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `reservationID` | path | string | Yes | Reservation ID |
| `forcePayment` | query | boolean | No | Force payment flag |

**Responses:**

| Code | Description | Schema |
|---|---|---|
| 200 | Success | `VwReservation` |
| 500 | Error not intercepted | — |

---

#### 3.1.7 PUT `/v2/reservations/{reservationID}/cancel` — Cancel Reservation ⭐

Cancel a reservation. **Only works for `draft` state reservations.**

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `reservationID` | path | string | Yes |

**Responses:**

| Code | Description | Schema |
|---|---|---|
| 200 | Success | `VwReservation` |
| 500 | Error not intercepted | — |

---

#### 3.1.8 PUT `/v2/reservations/{reservationID}/revoke` — Revoke Reservation ⭐

Revoke a confirmed reservation (cancellation after payment/confirmation).

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `reservationID` | path | string | Yes |

**Response 200:** `VwReservation`

---

#### 3.1.9 PUT `/v2/reservations/{reservationID}/reject` — Reject Reservation

Reject a reservation.

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `reservationID` | path | string | Yes |

**Response 200:** `VwReservation`

---

#### 3.1.10 PUT `/v2/reservations/{reservationID}/refund` — Refund Reservation

Process a refund for a reservation.

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `reservationID` | path | string | Yes |

**Response 200:** `VwReservation`

---

### 3.2 Contacts Endpoints (v2)

#### 3.2.1 POST `/v2/contacts` — Create Contact

Create a new contact in the winery's CRM.

**Request Body:** `ContactDTO` (required)

**Response 200:** `ContactDTO`

---

#### 3.2.2 POST `/v2/contacts/email` — Get Contact by Email

Look up a contact by email and winery ID.

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `email` | query | string | Yes |
| `wineryId` | query | string | Yes |

**Response 200:** `ContactExportDTO`

---

#### 3.2.3 GET `/v2/contacts/{contactId}` — Get Contact by ID

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `contactId` | path | integer (int64) | Yes |

**Response 200:** `ContactExportDTO`

---

#### 3.2.4 POST `/v2/contacts/query` — Query Contacts

Retrieve contacts filtered by date range.

**Request Body:** `Filter` (required)

**Response 200:** `Array<ContactExportDTO>`

---

#### 3.2.5 PUT `/v2/contacts/update-short/{contactId}` — Update Contact (Essential Fields)

Update only the core fields of a contact.

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `contactId` | path | integer (int64) | Yes |
| `contact` | body | ContactShortParams | Yes |

**Response 200:** (empty)

---

### 3.3 Availability Endpoints (v2)

#### 3.3.1 POST `/v2/availabilities/query` — Check Availability (Extended)

Same as OCTO extended availability. Returns `Result` model.

**Request Body:** `AvailabilityRequest` (required)

**Response 200:** `Array<Result>`

---

#### 3.3.2 POST `/v2/availabilities/actions` — CRUD Slot Actions

Create, update, or perform actions on experience slot availability.

**Request Body:** `CRUDAndActionsExperienceSlotsAvailabilityFullCommand` (required)

**Response 200:** `Array<Result>`

---

### 3.4 Experiences Endpoints

#### 3.4.1 GET `/v2/experiences` — List Experiences

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `lang` | query | string | Yes |

**Response 200:** `Array<ExperienceDetails>`

---

#### 3.4.2 POST `/v2/experiences` — Create/Update Experience

**Request Body:** `ExperienceAllParamsInput` (required)

**Response 200:** `CreationResponse`

---

#### 3.4.3 POST `/v2/experiences/query` — Query Experiences

**Request Body:** `RequestExperienceFilter` (required)

**Response 200:** `Array<ExperienceDetails>`

---

#### 3.4.4 POST `/v2/experiences/sync/{id}` — Sync Experience

Synchronize a specific experience.

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `id` | path | string (uuid) | Yes |

**Response 200:** (empty)

---

#### 3.4.5 GET `/v2/experiences/{id}` — Get Experience by ID

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `id` | path | string (uuid) | Yes |
| `lang` | query | string | Yes |

**Response 200:** `ExperienceDetails`

---

### 3.5 Orders Endpoints

#### 3.5.1 POST `/v2/orders/query` — Query Orders

**Request Body:** `Filter` (required)

**Response 200:** `object`

---

#### 3.5.2 GET `/v2/orders/{id}` — Get Order by ID

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `id` | path | string | Yes |

**Response 200:** `object`

---

### 3.6 Winery Info Endpoint

#### 3.6.1 GET `/v2/winery-info/{wineryId}` — Get Winery Info

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `wineryId` | path | string (uuid) | No |

**Response 200:** `Result`

---

### 3.7 Closing Days Endpoints

#### 3.7.1 GET `/v2/closing-days/{wineryId}` — Get Closing Days

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `wineryId` | path | string (uuid) | No |

**Response 200:** `Array<ClosingDay>`

---

#### 3.7.2 POST `/v2/closing-days/{wineryId}/filter` — Get Closing Days (Filtered)

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `wineryId` | path | string (uuid) | No |
| `request` | body | Request | Yes |

**Response 200:** `Array<ClosingDay>`

---

### 3.8 Low-Priority Endpoints (Minimal)

These endpoints are part of Divinea's e-commerce features and are **not needed** for the Traverum availability/booking integration.

#### Coupons (`/v2/coupons/...`)

| Method | Path | Summary |
|---|---|---|
| POST | `/v2/coupons` | Upsert coupon |
| POST | `/v2/coupons/consume` | Consume a coupon |
| GET | `/v2/coupons/list` | Get all coupons |
| GET | `/v2/coupons/list-valid` | Get valid coupons only |
| POST | `/v2/coupons/validate` | Validate a coupon |
| GET | `/v2/coupons/with-id` | Get single coupon by filters |
| GET | `/v2/coupons/{id}` | Get single coupon by ID |

#### Gifts (`/v2/gifts/...`)

| Method | Path | Summary |
|---|---|---|
| GET | `/v2/gifts` | List gifts with filters |
| POST | `/v2/gifts/resend-emails` | Resend gift emails |
| GET | `/v2/gifts/{giftId}` | Get gift by UUID |
| PUT | `/v2/gifts/{giftId}` | Update gift |
| POST | `/v2/gifts/{giftId}/redeem` | Redeem gift |
| GET | `/v2/gifts/{giftId}/voucher` | Create voucher for gift |
| POST | `/v2/gifts/experiences-title` | Get experience titles for gifts |

#### Customer Classes (`/v2/customerclass/...`)

| Method | Path | Summary |
|---|---|---|
| GET | `/v2/customerclass` | Get all customer classes by winery |
| POST | `/v2/customerclass` | Create a new customer class |
| GET | `/v2/customerclass/{id}` | Get customer class by ID |
| PUT | `/v2/customerclass/{id}` | Update customer class |
| DELETE | `/v2/customerclass/{id}` | Delete customer class |

#### Product Catalog (`/v2/product-catalog/...`)

Endpoints for managing wine/product catalog including products, attributes, categories, and product types. Not needed for booking integration.

#### Statistics (`/v2/statistics/...`)

Reporting and analytics endpoints. Not needed for booking integration.

#### Tags (`/v2/tags/...`)

Contact tagging endpoints. Not needed for booking integration.

#### Woocommerce (`/v2/woocommerce/...`)

Woocommerce integration webhooks and sync endpoints. Not needed for booking integration.

---

### 3.9 Integration v2 Models

#### ReservationDTO ⭐

The primary model for creating and managing reservations.

| Property | Type | Format | Required | Enum Values | Description | Example |
|---|---|---|---|---|---|---|
| `id` | string | uuid | No | — | Reservation ID (auto-generated on create) | `123a4567-e89b-12d3-a456-426614174000` |
| `contactId` | integer | int64 | No | — | Contact ID (if already associated) | `12312` |
| `createdAt` | string | date-time | **Yes** | — | Creation timestamp | `2021-01-01T12:00:00` |
| `updatedAt` | string | date-time | **Yes** | — | Last update timestamp | `2021-01-01T12:30:00` |
| `date` | string | date | **Yes** | — | Reservation date | `2021-01-01` |
| `time` | LocalTime | — | **Yes** | — | Reservation time | `12:00:00` |
| `experienceId` | string | uuid | **Yes** | — | Experience UUID | `123e4567-e89b-12d3-a456-426614174000` |
| `experienceTitleTranslations` | LabelTranslations | — | No | — | Translated experience titles | — |
| `guestCount01` | integer | int32 | **Yes** | — | Primary guest count (adults) | `1` |
| `guestCountTotal` | integer | int32 | **Yes** | — | Total guest count (all types) | `2` |
| `languageIso` | string | — | **Yes** | — | Language ISO code | `en` |
| `state` | string | — | **Yes** | `draft`, `waiting`, `confirmed`, `revoked`, `rejected`, `completed`, `deleted`, `canceled`, `hold_seat` | Reservation lifecycle state | `CONFIRMED` |
| `origin` | string | — | **Yes** | — | Booking origin URL/identifier | `https://www.divinea.com/` |
| `paid` | boolean | — | **Yes** | — | Whether payment has been received | `true` |
| `paymentCurrency` | string | — | **Yes** | — | Currency code | `EUR` |
| `netTotalCents` | integer | int64 | **Yes** | — | Net total in cents | `1000` |
| `grossTotalCents` | integer | int64 | No | — | Gross total in cents | `1000` |
| `discountTotalCents` | integer | int64 | No | — | Discount amount in cents | `0` |
| `manualDiscountTotalCents` | integer | int64 | No | — | Manual discount in cents | — |
| `dueTotalCents` | integer | int64 | No | — | Amount still due in cents | `0` |
| `paidTotalCents` | integer | int64 | No | — | Amount already paid in cents | `1000` |
| `giftId` | string | uuid | No | — | Related gift ID | `123e4567-e89b-12d3-a456-426614174000` |
| `message` | string | — | No | — | Message from the guest | — |
| `optionalData` | object | — | No | — | Legacy additional data (JSON) | — |
| `otherData` | object | — | No | — | Other data saved as JSON | — |
| `experiencePriceLabels` | array[ExperiencePriceLabel] | — | **Yes** | — | Price labels (guest types + pricing) | — |
| `experiencePriceExtras` | array[ExperiencePriceExtra] | — | **Yes** | — | Extra/add-on pricing | — |
| `reservationContacts` | array[ContactDTO] | — | **Yes** | — | Contacts associated with this reservation | — |
| `reservationMasterContact` | ContactDTO | — | No | — | Primary contact for this reservation | — |
| `wineryId` | string | uuid | **Yes** | — | Winery UUID | `123e4567-e89b-12d3-a456-426614174000` |

#### Reservation State Machine

```
  ┌─────────┐
  │  draft   │ ← Initial state when created
  └────┬─────┘
       │ confirm
       ▼
  ┌──────────┐     reject      ┌──────────┐
  │ waiting  │ ──────────────► │ rejected │
  └────┬─────┘                 └──────────┘
       │ confirm
       ▼
  ┌───────────┐    revoke     ┌─────────┐
  │ confirmed │ ────────────► │ revoked │
  └─────┬─────┘               └─────────┘
        │ complete
        ▼
  ┌───────────┐
  │ completed │
  └───────────┘

  draft ──cancel──► canceled
  draft ──delete──► deleted
  Any   ──hold───► hold_seat
```

**State descriptions:**

| State | Description |
|---|---|
| `draft` | Initial state. Reservation created but not yet submitted/confirmed. Can be canceled. |
| `waiting` | Submitted, awaiting confirmation from the winery. |
| `confirmed` | Confirmed by the winery. Guest is expected. Can be revoked. |
| `revoked` | Cancellation of a confirmed reservation (post-payment). |
| `rejected` | Winery rejected the reservation. |
| `completed` | The experience took place. Terminal state. |
| `deleted` | Soft-deleted reservation. |
| `canceled` | Canceled before confirmation (draft only). |
| `hold_seat` | Seat is held/reserved temporarily. |

#### ReservationInput

Simplified input model for the import endpoint. Has the same core fields as ReservationDTO plus:

| Extra Property | Type | Required | Description |
|---|---|---|---|
| `closeSlots` | boolean | No | Whether to close the slot after import |
| `openSlots` | boolean | No | Whether to open slots |
| `reservation` | object | No | Nested reservation reference |
| `reservationContacts` | array[object] | Yes | Contact information |
| `sendNotification` | boolean | No | Whether to send notification emails |
| `slotId` | string | No | Specific slot ID |
| `state` | string | Yes | Reservation state (same enum as ReservationDTO) |

#### VwReservation

View model returned by state-change operations (confirm, cancel, revoke, reject, refund). Contains all reservation fields plus additional view-specific data:

| Property | Type | Description |
|---|---|---|
| `id` | string (uuid) | Reservation ID |
| `state` | string | Current state after the operation |
| `date` | string (date) | Reservation date |
| `createdAt` / `updatedAt` | string (date-time) | Timestamps |
| `experienceId` | string (uuid) | Experience ID |
| `contactId` | integer (int64) | Contact ID |
| `guestCount01` / `guestCountTotal` | integer | Guest counts |
| `netTotalCents` / `grossTotalCents` / `dueTotalCents` / `paidTotalCents` | integer (int64) | Financial fields |
| `paid` | boolean | Payment status |
| `checkedIn` | boolean | Whether guest checked in |
| `languageIso` | string | Language |
| `message` / `notes` / `feedback` | string | Text fields |
| `origin` | string | Booking origin |
| `experience` | array | Experience details |
| `experiencePrices` / `experiencePricesExtras` | array | Pricing |
| `experienceTranslations` | array | Translations |
| `masterContactName` | string | Primary contact name |
| `hasPaymentLink` | boolean | Whether a payment link exists |
| `employeeId` | string (uuid) | Assigned employee |
| Additional view fields | various | `invoiceData`, `isSales`, `isTourOperator`, `notifyContact`, etc. |

#### ContactDTO (v2 — used in ReservationDTO.reservationContacts)

| Property | Type | Required | Description |
|---|---|---|---|
| `firstName` | string | **Yes** | First name |
| `lastName` | string | **Yes** | Last name |
| `email` | string | **Yes** | Email address |
| `phoneNumber` | string | **Yes** | Phone number |
| `countryIso` | string | **Yes** | Country ISO code (e.g. `IT`, `US`) |
| `contactType` | string | **Yes** | `MASTER` (required, at least one) or `SECONDARY` |
| `acceptedMarketing` | boolean | No | Marketing consent |
| `acceptedPrivacyTerms` | boolean | No | Privacy terms consent |
| `acceptedProfiling` | boolean | No | Profiling consent |
| `manualMarketing` | boolean | No | Manual marketing flag (winery has signed paper) |
| `unsubscribed` | boolean | No | Unsubscribed from communications |
| `otherData` | object | No | Additional JSON data |

#### ExperiencePriceLabel

Represents a guest-type pricing line (e.g., "Adult", "Child").

| Property | Type | Format | Required |
|---|---|---|---|
| `id` | integer | int64 | No |
| `experience_id` | string | uuid | No |
| `islabel1` | boolean | — | No |
| `position` | integer | int32 | No |
| `price_cents` | number | double | No |
| `price_currency` | string | — | No |
| `quantity` | integer | int32 | No |
| `title_translations` | Translatable | — | No |
| `created_at` | string | date | No |
| `updated_at` | string | date | No |

#### ExperiencePriceExtra

Represents an add-on/extra pricing line (e.g., "Lunch add-on", "Premium tasting").

| Property | Type | Format | Required |
|---|---|---|---|
| `id` | integer | int64 | No |
| `experience_id` | string | uuid | No |
| `position` | integer | int32 | No |
| `price_cents` | number | double | No |
| `price_currency` | string | — | No |
| `quantity` | integer | int32 | No |
| `title_translations` | Translatable | — | No |
| `created_at` | string | date | No |
| `updated_at` | string | date | No |

#### Filter (used for query endpoints)

| Property | Type | Format | Description |
|---|---|---|---|
| `dateFrom` | string | date-time | Start of date range |
| `dateTo` | string | date-time | End of date range |

#### ContactShortParams (for update-short endpoint)

| Property | Type | Required |
|---|---|---|
| `firstName` | string | No |
| `lastName` | string | No |
| `email` | string | No |
| `phoneNumber` | string | No |
| `countryIso` | string | No |
| `manualMarketing` | string | No |

---

## 4. API Group: Integration v3

Tags: `ContactAPI_v3`, `OrderImportAPI_v3`, `OrdersAPI_v3`

### 4.1 Contacts Endpoints (v3)

#### 4.1.1 POST `/v3/contacts` — Create Contact

**Request Body:** `ContactDTO` (v3 version, required)

**Response 200:** `ContactDTO`

---

#### 4.1.2 POST `/v3/contacts/email` — Get Contact by Email

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `email` | query | string | Yes |
| `wineryId` | query | string | Yes |

**Response 200:** `ContactExportDTOV3`

---

#### 4.1.3 GET `/v3/contacts/{contactId}` — Get Contact by ID

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `contactId` | path | integer (int64) | Yes |

**Response 200:** `ContactExportDTOV3`

---

#### 4.1.4 POST `/v3/contacts/query` — Query Contacts by Date

**Request Body:** `Param` (required)

```json
{
  "dateFrom": "2025-01-01T00:00:00",
  "dateTo": "2025-06-30T23:59:59"
}
```

**Response 200:** `Array<ContactExportDTOV3>`

---

#### 4.1.5 PUT `/v3/contacts/update-short/{contactId}` — Update Contact (Essential Fields)

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `contactId` | path | integer (int64) | Yes |
| `contact` | body | ContactShortParams | Yes |

**Response 200:** (empty)

---

### 4.2 Orders Endpoints (v3)

#### 4.2.1 POST `/v3/orders/query` — Query Orders by Date

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `APIKey` | header | string | Yes |
| `requestParam` | body | Param | Yes |

**Response 200:** `object`

---

#### 4.2.2 GET `/v3/orders/{id}` — Get Order by ID

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `APIKey` | header | string | Yes |
| `id` | path | string | Yes |

**Response 200:** `OrdersAndReservationsDTOV3`

---

### 4.3 Order Import Endpoint (v3)

#### 4.3.1 POST `/v3/order-import/{apiChannelKey}` — Create External Order

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `apiChannelKey` | path | string | Yes |
| `request` | body | RequestExternalOrder | Yes |

**Response 200:** `string`

---

### 4.4 Integration v3 Models

#### ContactDTO (v3)

| Property | Type | Format | Required | Description | Example |
|---|---|---|---|---|---|
| `firstName` | string | — | **Yes** | First name | `John` |
| `lastName` | string | — | **Yes** | Last name | `Doe` |
| `emails` | array[Email] | — | **Yes** | Email addresses | `[{"email":"john@gmail.com","type":"master"}]` |
| `phoneNumbers` | array[Phone] | — | **Yes** | Phone numbers | `[{"phone":"+1234567890","type":"master"}]` |
| `countryISO` | string | — | **Yes** | Country ISO code | `IT` |
| `email` | string | — | No | Single email (convenience field) | — |
| `phoneNumber` | string | — | No | Single phone (convenience field) | — |
| `contactType` | string | — | No | Contact type | — |
| `country` | string | — | No | Country name | — |
| `city` | string | — | No | City name | `Rome` |
| `cap` | string | — | No | Postal code (CAP) | `00100` |
| `province` | string | — | No | Province | `RM` |
| `dateOfBirth` | string | date | No | Date of birth | `1980-01-01` |
| `languageISO` | string | — | No | Language ISO | `EN` |
| `wineryID` | string | — | No | Associated winery ID | — |
| `acceptedMarketing` | boolean | — | No | Marketing consent | `true` |
| `acceptedPrivacyTerms` | boolean | — | No | Privacy terms | `true` |
| `acceptedProfiling` | boolean | — | No | Profiling consent | `true` |
| `manualMarketing` | boolean | — | No | Manual marketing flag | `false` |
| `unsubscribed` | boolean | — | No | Unsubscribed | `false` |
| `masterEmail` | Email | — | No | Master email object | — |

#### Email

| Property | Type | Enum | Description | Example |
|---|---|---|---|---|
| `email` | string | — | Email address | `john.doe@gmail.com` |
| `type` | string | `master`, `secondary`, `work`, `additionalWork`, `pec` | Email type | `master` |
| `master` | boolean | — | Whether this is the master email | — |

#### Phone

| Property | Type | Enum | Description | Example |
|---|---|---|---|---|
| `phone` | string | — | Phone number | `+1234567890` |
| `type` | string | `master`, `secondary`, `work` | Phone type | `master` |

#### ContactExportDTOV3

Response model for contact queries. Contains all ContactDTO fields plus:

| Extra Property | Type | Description |
|---|---|---|
| `id` | integer (int64) | Contact ID |
| `contactValue` | number (double) | Calculated contact value |
| `addresses` | array[AddressExportDTO] | Addresses |
| `wineryId` | string | Winery ID |

#### AddressExportDTO

| Property | Type |
|---|---|
| `address` | string |
| `city` | string |
| `province` | string |
| `zipcode` | string |
| `countryISO` | string |

#### ContactShortParams (v3)

| Property | Type |
|---|---|
| `firstName` | string |
| `lastName` | string |
| `email` | string |
| `phoneNumber` | string |
| `countryIso` | string |
| `manualMarketing` | string |

#### OrdersAndReservationsDTOV3

| Property | Type | Format | Description |
|---|---|---|---|
| `id` | string | — | Order/reservation ID |
| `externalId` | string | — | External reference ID |
| `wineryId` | string | — | Winery ID |
| `contactId` | string | — | Contact ID |
| `channelId` | integer | int32 | Sales channel ID |
| `channelName` | string | — | Sales channel name |
| `orderType` | string | — | Order type |
| `status` | string | — | Order status |
| `paid` | boolean | — | Payment status |
| `paymentMethod` | string | — | Payment method |
| `creationDate` | string | date-time | Creation timestamp |
| `updatedDate` | string | date-time | Last update timestamp |
| `deliveryDate` | string | date-time | Delivery date |
| `grossTotalPrice` | number | double | Gross total price |
| `netTotalPrice` | number | double | Net total price |
| `couponCode` | string | — | Applied coupon code |
| `couponDiscountTotalCents` | number | double | Coupon discount in cents |
| `manualDiscountTotalCents` | number | double | Manual discount in cents |
| `giftCents` | number | double | Gift amount in cents |
| `vatRate` | string | — | VAT rate |
| `pointOfSaleWineSuiteId` | string | uuid | Point-of-sale ID |
| `products` | array[OrdersAndReservationsProductDTO] | — | Line items |

#### OrdersAndReservationsProductDTO

| Property | Type | Format |
|---|---|---|
| `productId` | string | uuid |
| `productName` | string | — |
| `quantity` | integer | int32 |
| `netPrice` | number | double |
| `metadata` | object (map[string,string]) | — |

#### Param (query parameter for date-range filters)

| Property | Type | Format |
|---|---|---|
| `dateFrom` | string | date-time |
| `dateTo` | string | date-time |

---

## 5. API Group: Order Import

Minimal API for importing external orders into Divinea.

### 5.1 POST `/order-import/{apiKey}` — Create External Order

**Parameters:**

| Name | In | Type | Required |
|---|---|---|---|
| `apiKey` | path | string | Yes |
| `request` | body | RequestExternalOrder | Yes |

**Response 200:** `string`

### 5.2 Models

#### RequestExternalOrder

| Property | Type | Format | Description |
|---|---|---|---|
| `id` | string | — | External order ID |
| `date` | string | date | Order date |
| `status` | string | — | Order status |
| `buyerFirstname` | string | — | Buyer first name |
| `buyerLastname` | string | — | Buyer last name |
| `buyerEmail` | string | — | Buyer email |
| `buyerPhone` | string | — | Buyer phone |
| `address` | string | — | Delivery address |
| `addressName` | string | — | Address label |
| `city` | string | — | City |
| `province` | string | — | Province |
| `region` | string | — | Region |
| `zipcode` | string | — | ZIP/postal code |
| `countryIso` | string | — | Country ISO |
| `notes` | string | — | Order notes |
| `paymentMethod` | string | — | Payment method |
| `quantity` | integer | int64 | Total quantity |
| `amountCents` | integer | int64 | Total amount in cents |
| `amountDiscountCents` | integer | int64 | Discount in cents |
| `amountShipmentCents` | integer | int64 | Shipping in cents |
| `amountVatCents` | integer | int32 | VAT in cents |
| `amountVatPercentage` | number | double | VAT percentage |
| `amountExciseDutyCents` | integer | int32 | Excise duty in cents |
| `items` | array[Item] | — | Line items |

#### Item

| Property | Type | Format |
|---|---|---|
| `externalId` | string | — |
| `name` | string | — |
| `quantity` | integer | int64 |
| `amountCents` | integer | int64 |
| `amountDiscountCents` | integer | int64 |

---

## 6. Enum Reference

### Availability Status (OCTO)

| Value | Description |
|---|---|
| `AVAILABLE` | Slots are available for booking |
| `FREESALE` | Unlimited availability (no capacity tracking) |
| `SOLD_OUT` | No remaining capacity |
| `LIMITED` | Limited availability remaining |
| `CLOSED` | Slot/day is closed, no bookings accepted |

### Reservation State (Integration v2)

| Value | Description |
|---|---|
| `draft` | Initial state, not yet submitted |
| `waiting` | Submitted, awaiting winery confirmation |
| `confirmed` | Confirmed by winery |
| `revoked` | Cancelled after confirmation |
| `rejected` | Rejected by winery |
| `completed` | Experience completed |
| `deleted` | Soft-deleted |
| `canceled` | Cancelled before confirmation (draft only) |
| `hold_seat` | Temporary seat hold |

### Email Type

| Value | Description |
|---|---|
| `master` | Primary email |
| `secondary` | Secondary email |
| `work` | Work email |
| `additionalWork` | Additional work email |
| `pec` | PEC (Italian certified email) |

### Phone Type

| Value | Description |
|---|---|
| `master` | Primary phone |
| `secondary` | Secondary phone |
| `work` | Work phone |

### Contact Type (in ReservationDTO.reservationContacts)

| Value | Description |
|---|---|
| `MASTER` | Primary contact (at least one required) |
| `SECONDARY` | Additional contact |

---

## Quick Reference: Traverum Integration Workflow

### 1. Test Connectivity
```
GET /octo/supplier
Headers: APIKey: <key>
```

### 2. Check Availability
```
POST /octo/availability/extended
Headers: APIKey: <key>
Body: { "productId": "<experienceUUID>", "localDateStart": "2025-06-01", "localDateEnd": "2025-06-07" }
```

### 3. Create Draft Reservation
```
POST /v2/reservations/integration/NEW
Headers: APIKey: <key>
Body: { ReservationDTO with state: "draft" }
```

### 4. Confirm After Payment
```
PUT /v2/reservations/{reservationID}/confirm
Headers: APIKey: <key>
```

### 5. Cancel Draft (guest didn't pay)
```
PUT /v2/reservations/{reservationID}/cancel
Headers: APIKey: <key>
```

### 6. Revoke Confirmed (post-payment cancellation)
```
PUT /v2/reservations/{reservationID}/revoke
Headers: APIKey: <key>
```

### 7. Create/Upsert Guest Contact
```
POST /v3/contacts
Headers: APIKey: <key>
Body: { ContactDTO v3 }
```

---

*Generated from Divinea Wine Suite OpenAPI specs (staging environment). Spec version 2.0.1.*
