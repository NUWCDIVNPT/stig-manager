.. _legacy-client-index:

Legacy Client
===============

.. meta::
  :description: How to use the legacy STIG Manager web UI.

.. note::
   The current version of STIG Manager includes two versions of its web UI: the legacy UI, which is the default, and a preview of the new UI. Both work with the same API and data, so your Collections, Assets, and Reviews are the same in each. The legacy UI will be deprecated and then removed in a future release, in favor of the new UI.

These pages describe the legacy UI. To try the new UI, use the "Try the new UI" link at the bottom of the Navigation Tree.

.. thumbnail:: /assets/images/legacy-try-new-ui.png
      :width: 25% 
      :show_caption: True
      :title: The "Try the new UI" link in the legacy UI's Navigation Tree

See the :ref:`new-client-index` section for documentation of the new UI.

.. rubric:: For Users

* :ref:`legacy-user-quickstart`: a step-by-step tour of a typical use case, from creating a Collection to producing a POA&M.
* :ref:`legacy-user-guide-doc`: every part of the UI available to Users.

.. rubric:: For Admins

* :ref:`legacy-admin-quickstart`: typical responsibilities of an App Manager, such as keeping STIGs up to date.
* :ref:`legacy-admin-guide-doc`: every part of the UI available to App Managers.

.. rubric:: General Information

* :ref:`legacy-roles-and-access`: how Grants, Roles, and Access Control Lists determine access to Collections.
* :ref:`legacy-review-handling`: how Reviews are tracked across STIG Revisions and matched to Rules.
* :ref:`legacy-rule-exceptions`: how Reviews behave for Rules that DISA has republished with different content.

.. toctree::
   :hidden:
   :maxdepth: 3
   :numbered: 5

   user-guide/user-quickstart
   user-guide/user-guide
   admin-guide/admin-quickstart
   admin-guide/admin-guide
   user-guide/roles-and-access
   user-guide/review-handling
   user-guide/rule-exceptions
