Reviewed by Elias on 12-02

---

All the scenarios we must be able to handle in our dashboard.

Single Organization Scenarios
1. Pure Supplier
A tour operator who creates and sells experiences.
1 org (supplier)
Creates experiences, connects Stripe, manages bookings
Example: a kayaking guide offering tours
2. Pure Hotel (single property)
A hotel that wants to sell third-party experiences to guests.
1 org (hotel)
1 hotel_config
Browses and toggles on supplier experiences, embeds the widget
Example: a boutique hotel offering local tours via their website
3. Pure Hotel (multiple properties)
A hotel owner with several properties, all under one company.
1 org (hotel)
Multiple hotel_configs (one per property)
Each property has its own slug, widget, and experience selection
Example: a family that owns 3 hotels around a lake
4. Hotel + Own Experiences (single property)
A hotel that also creates and runs its own experiences (cooking class, wine tasting, etc).
1 org (both supplier + hotel capabilities)
1 hotel_config
Creates own experiences AND can toggle on third-party supplier experiences
Needs Stripe for their own experience payouts
Example: an agriturismo that offers farm tours and cooking classes
5. Hotel + Own Experiences (multiple properties)
Same as above but with multiple hotel properties.
1 org (both capabilities)
Multiple hotel_configs
Each property can have a different selection of experiences (own + third-party)
Example: a resort chain where each location offers different activities
Multi-Organization Scenarios
6. Separate Hotel and Supplier Businesses
An entrepreneur who owns a hotel company and a separate experience company (different legal entities).
2 orgs: one hotel, one supplier
Switches between them via the account dropdown
Example: someone who owns a hotel AND separately runs a boat tour company
7. Multiple Supplier Businesses
Someone who runs multiple independent experience companies.
2+ orgs (all suppliers)
Each has its own Stripe, experiences, bookings
Example: someone who runs a scuba diving company and a separate hiking guide company
8. Multiple Hotel Companies
A hospitality investor with separate hotel companies.
2+ orgs (all hotels)
Each org has its own set of hotel_configs
Example: someone who owns a luxury hotel brand AND a budget hostel brand
9. Mix of Everything
The hospitality entrepreneur with multiple separate businesses of different types.
3+ orgs of mixed types
Example: owns a tour company (supplier), a hotel group (hotel with 2 properties), and an adventure park (supplier with hotel capability for their lodge)