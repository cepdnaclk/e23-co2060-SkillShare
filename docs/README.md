---
layout: home
permalink: index.html

# Please update this with your repository name and project title
repository-name: eYY-co2060-project-template
title: Project Template
---

[comment]: # "This is the standard layout for the project, but you can clean this and use your own template, and add more information required for your own project"

<!-- Once you fill the index.json file inside /docs/data, please make sure the syntax is correct. (You can use this tool to identify syntax errors)

Please include the "correct" email address of your supervisors. (You can find them from https://people.ce.pdn.ac.lk/ )

Please include an appropriate cover page image ( cover_page.jpg ) and a thumbnail image ( thumbnail.jpg ) in the same folder as the index.json (i.e., /docs/data ). The cover page image must be cropped to 940×352 and the thumbnail image must be cropped to 640×360 . Use https://croppola.com/ for cropping and https://squoosh.app/ to reduce the file size.

If your followed all the given instructions correctly, your repository will be automatically added to the department's project web site (Update daily)

A HTML template integrated with the given GitHub repository templates, based on github.com/cepdnaclk/eYY-project-theme . If you like to remove this default theme and make your own web page, you can remove the file, docs/_config.yml and create the site using HTML. -->

# Skill-Share by ZenWare

---

## Team
-  E/23/035, Irusha Bandara, [email](e23035@eng.pdn.ac.lk)
-  E/23/104, Poorna Gamage, [email](e23104@eng.pdn.ac.lk)
-  E/23/430, Hiruni Weerasinghe, [email](e23430@eng.pdn.ac.lk)
-  E/23/317, Sashika Rathnayake, [email](e23317@eng.pdn.ac.lk)

<!-- Image (photo/drawing of the final hardware) should be here -->

<!-- This is a sample image, to show how to add images to your page. To learn more options, please refer [this](https://projects.ce.pdn.ac.lk/docs/faq/how-to-add-an-image/) -->

<!-- ![Sample Image](./images/sample.png) -->

#### Table of Contents
1. [Introduction](#introduction)
2. [Solution Architecture](#solution-architecture )
3. [Software Designs](#hardware-and-software-designs)
4. [Testing](#testing)
5. [Conclusion](#conclusion)
6. [Links](#links)

## Introduction

In today’s academic environments, students often possess valuable skills but lack a structured way to share them, leading to underutilized peer knowledge. Current methods for finding mentors or study partners are inefficient, relying on manual coordination and failing to solve complex scheduling conflicts. Skill-Share by ZenWare addresses this by providing a campus-oriented, full-stack platform that uses smart algorithms to connect students.

The solution goes beyond simple searching; it identifies multi-user "skill cycles" (where Student A teaches B, and B teaches C) and automatically syncs free time slots to eliminate scheduling headaches. By integrating a Trust Score System and real-time communication, it builds a reliable learning community.

The impact is a more connected university ecosystem where learning is accessible and collaborative. It empowers students to trade knowledge as a resource, reducing reliance on expensive external tutoring and maximizing the collective potential of the student body.


## Solution Architecture

<img width="1050" height="809" alt="Screenshot 2026-05-02 000315" src="https://github.com/user-attachments/assets/c61676d3-8b57-4870-82f2-814d144d4b16" />

The platform is engineered to solve a specific campus problem: the "hidden" skills of university students. The architecture transitions users from an inefficient "As-Is" state (relying on WhatsApp, paid materials, or unreliable AI) to a secure, centralized peer-to-peer network. At a high level, the system utilizes JWT authentication for secure access, connecting users through a live auto-suggest search engine (by user or skill) and managing interactions via an automated availability and notification system.

## Software Designs

Our software design centers on empowering the user rather than forcing automated matches. We originally designed a "Skill-Cycle" algorithm, but identified critical edge cases: unacceptable wait times, infinite relationship loops, and the restriction that a user must both teach and learn.
To resolve this, we pivoted to a decentralized Credit and Reputation Economy.

Core Mechanics: Users manage their own availability and book individual sessions.

The Economy: To learn a skill, users spend credits. To earn credits, they are incentivized to teach others. This gamifies the peer-to-peer process and completely eliminates the bottleneck of waiting for a perfect "match cycle."

Two-Way Feedback: Completed sessions use a dual-feedback submission design to calculate a reliable user reputation score.

## Testing

Testing focused heavily on our core custom logic and security. We executed comprehensive unit and integration tests to ensure that our JWT security filters, real-time Notification system, and complex Credit Score economy (ensuring credits are correctly deducted or awarded during bookings) functioned flawlessly under various edge cases.

<img width="762" height="837" alt="Screenshot 2026-05-01 221729" src="https://github.com/user-attachments/assets/2f291361-5384-40e3-83cb-77671e641d42" /> 
<img width="760" height="486" alt="Screenshot 2026-05-02 002009" src="https://github.com/user-attachments/assets/d2f676b9-d23f-4ddb-b578-1d6be3239b98" />

## Conclusion

We successfully achieved our MVP goal: providing a functional, trustworthy platform to unlock hidden campus skills.

Achieved: We delivered a fully functioning system complete with secure login/signup, user dashboards, live skill searching, individual session booking, credit/reputation scoring, and a two-way feedback system. We also successfully navigated our biggest technical hurdle by pivoting from a flawed matching algorithm to a robust credit economy.

Future Developments (Semester 4 Plan): We plan to expand the platform's commercial and community value by introducing Group Sessions, a Course Pool, and a Real-time Chat system. We will also heavily gamify the experience (Experience badges, Newsfeed celebrations, Online store) and improve accessibility via Google integrations (Signup & Calendar), cross-platform web-app capabilities, and a dedicated Admin authorization tier.

## Links

- [Project Repository](https://github.com/cepdnaclk/e23-2YP-SkillShare.git)
- [Project Page](https://cepdnaclk.github.io/e23-2YP-SkillShare/)
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)

[//]: # (Please refer this to learn more about Markdown syntax)
[//]: # (https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
