.. _new-client-index:

New Client
===============

.. meta::
  :description: How to use the new STIG Manager web UI.

.. note::
   The current version of STIG Manager includes two versions of its web UI: the legacy UI, which is the default, and a preview of the new UI. Both work with the same API and data, so your Collections, Assets, and Reviews are the same in each. The legacy UI will be deprecated and then removed in a future release, in favor of the new UI.

These pages describe the new UI. From the legacy UI, open it with the "Try the new UI" link at the bottom of the Navigation Tree.

.. thumbnail:: /assets/images/legacy-try-new-ui.png
      :width: 25% 
      :show_caption: True
      :title: The "Try the new UI" link in the legacy UI's Navigation Tree

See the :ref:`legacy-client-index` section for documentation of the legacy UI.

.. rubric:: For Users

* :ref:`user-quickstart`: a step-by-step tour of a typical use case, from creating a Collection to producing a POA&M.
* :ref:`user-guide-doc`: every part of the UI available to Users.

.. rubric:: For Admins

* :ref:`admin-quickstart`: typical responsibilities of an App Manager, such as keeping STIGs up to date.
* :ref:`admin-guide-doc`: every part of the UI available to App Managers.

.. rubric:: General Information

* :ref:`roles-and-access`: how Grants, Roles, and Access Control Lists determine access to Collections.
* :ref:`review-handling`: how Reviews are tracked across STIG Revisions and matched to Rules.
* :ref:`rule-exceptions`: how Reviews behave for Rules that DISA has republished with different content.

.. toctree::
   :hidden:
   :maxdepth: 3
   :numbered: 5

   /user-guide/user-quickstart
   /user-guide/user-guide
   /admin-guide/admin-quickstart
   /admin-guide/admin-guide
   /user-guide/roles-and-access
   /user-guide/review-handling
   /user-guide/rule-exceptions
