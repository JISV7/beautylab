# Project: User Interfaces

## Evaluation 1: Website with Customization Interface

**Submission:** Week 4

### 1. Project Objective

Develop a website for a store or company (real or fictional) that includes a dynamic design system. The main focus is to create an administration panel that allows modifying the visual appearance of the site (fonts and color palettes) in real time, in an orderly manner and without the need to modify the source code. Ensuring a maintainable and scalable website since new functionalities will be developed in the following evaluations.

### 2. System Roles

The system must consider two types of users with different experiences:

1.  **End User:** Browses and interacts with the public website using the already applied designs. They should have the freedom to manually toggle between available themes (light, dark, or accessibility). Additionally, the site must detect system preferences: if the user's operating system (Windows, Android, macOS, etc.) is set to dark or light mode, the website should adopt that theme by default on their first visit.
2.  **Administrator:** Accesses an internal configuration panel to manage and customize the visual appearance of the site.

### 3. User View Requirements (Public Site)

*   **Base Structure:** The website must contain at least the following sections: *Header*, *Hero* (main highlighted section), *Carousel*, Services Section, and *Footer*.
*   **Components:** Use of decorative elements/icons, forms, and buttons correctly styled according to the chosen theme.
*   **Interconnected Design:** The design system must be proportional. For example, the base size of the paragraph typography should automatically affect and scale the size of buttons and header elements (The use of relative units is mandatory to create a responsive and adaptable site).

### 4. Administrator View Requirements (Configuration Panel)

This is the core of the evaluation. The administrator must have a visual configuration module. The administrator interface must be designed under a scalable Dashboard structure. This implies maintaining a fixed navigation bar (sidebar or top bar) and only dynamically updating the central container/module in use. This will lay the groundwork for integrating new modules in the following evaluations.

*   **Dynamic Management:** Tools to change global colors and integrate different font families (e.g., a select dropdown to choose from 5 fonts that were previously downloaded and uploaded).
*   **Live Preview:** When selecting a new font or palette, the administrator must instantly see how the changes look in an area of their configuration panel.
*   **Elements to Preview:** The sample area must include clear examples of: paragraphs, buttons, components (e.g., product *cards*), form fields (*inputs*, *selects*, *textareas*), and samples of how the colors and fonts would look applied to the site before confirming the changes.

### 5. Design and Accessibility Requirements

The system must be capable of supporting and presenting the following configurations:

*   **Typography Hierarchy:** Define and apply specific and consistent sizes for headings, subheadings, paragraphs, and labels.
*   **Dark Mode:** The design must include the ability to switch between light and dark themes.
*   **Color Palettes to Present:** Three (3) design variants must be configured and displayed, each with its respective dark mode:
1.  **Light:**.
2.  **Dark:**.
3.  **Accessibility**.

This are the minimun requirements to present the evaluation.