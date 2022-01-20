.. _user-quickstart:


STIG Manager User Walkthrough
########################################

This User Walkthrough will walk you through a typical use case for STIG Manager, from creating your own Collection, creating Assets in that Collection, to evaluating STIGs and creating a POAM from your findings. Depending on your role in your organization, not all of these steps may apply to you, but should be helpful in providing context for the use of this tool. If you are comfortable, feel free to skip around using the sidebar navigation to the left.

For more detailed information about every STIG Manager function available to users, please see the :ref:`user-guide-doc`.

STIG Manager's primary organizational structure is the :term:`Collection`. 
Collections are composed of:

* :term:`Assets <Asset>`
* :term:`STIGs <STIG>` attached to those Assets
* :term:`User Grants <User>` providing access to some or all of the Assets/STIGs in that Collection
* :term:`Reviews <Review>`

This Walkthrough will step you through creating each of these items. 

.. ATTENTION::
   **Collections can be structured as an RMF Package, but do not need to be.** It is recommended that large packages be broken up into more easily-manageable Collections, to which Users can be granted higher access and, therefore, greater autonomy. 



.. raw:: html

  <iframe width="560" height="315" src="https://www.youtube.com/embed/wv_Gdbl_LrU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

----------------------

.. raw:: html

  <iframe width="560" height="315" src="https://www.youtube.com/embed/ZwVJ0eO2d_I" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Authentication 
================

When first accessing STIG Manager, you will be redirected to the Authentication Provider's Log In screen (Keycloak, Okta, F5, etc.).  Your method of authentication will depend on your Organization's specific deployment (CAC, username/password, account brokering, etc). Once complete, you will be redirected back to the STIG Manager User Interface. 


The Navigation Tree
======================================

The Nav Tree is located in STIG Managers leftmost panel, and provides Users access to their assigned Collections, Assets, STIGs, Reviews, and Reports. For Users with the appropriate Privileges and Grants, Administrative and Configuration functions are also available.

Create your first Collection
======================================

* **You may have already been given access to some Collections in STIG Manager, or you may not have the Collection Creator privilege. If your Nav Tree is already sufficiently populated, feel free to skip to the Evaluate Asset STIG Compliance section.**

By default, most users will have the Collection Creator role, allowing them to create their own Collection of Assets and their STIGs, and to provide access to them to other users in the system. 

#. After logging into the system, click the *+Create Collection* item in the Nav Tree on the left.

.. thumbnail:: /assets/images/nav-tree.png
      :width: 25% 
      :show_caption: True
      :title: Navigation Tree


#. You will be prompted for your Collection name, and some other info. Only a Collection name and Owner are required. Your Username will be prepopulated as an owner. Additional Grants, Settings and Metadata can stay as they are at this time. Click "Create" when finished. You will be taken to the Collection Configuration tab for this new Collection. You can access this Collection Configuration tab later using the "Manage" option under your Collection in the Nav Tree.


   .. thumbnail:: /assets/images/create-collection-popup.png
      :width: 50%
      :show_caption: True 
      :alt: Create Collection Popup
      :title: Create Collection Popup


Create Assets in your Collection
======================================

#. From the Collection Configuration tab, use the "Create Asset..." button in the Asset panel toolbar to create a couple sample assets. You can also attach STIGs from the "Create new Asset" popup at this time. The only required field is "Name," which must be unique in this Collection.
   * You can change all the properties of your asset, including attached STIGs later by double-clicking an asset or using the "Change Asset properties..." button in the Assets toolbar.  

.. thumbnail:: /assets/images/collection-manage-asset-create-button.png
   :width: 50% 
   :show_caption: True
   :alt: Create Asset Button
   :title: Create Asset Button


.. note::
   Assets and their STIG attachments can also be created automatically in bulk by importing STIG Viewer .ckl or XCCDF files using the "Import CKL or SCAP..." button. :ref:`More info about the Collection Builder function can be found in the User Guide.<Collection Builder>`

Attach STIGs to Assets in your Collection
============================================

#. Add or remove STIGs by double-clicking on an Asset in the Collection Management screen, and making the desired changes in the Asset Pop-up. Click the "Assign STIG" button in the popup to do this. Try to attach the same STIG to more than one Asset. It will help demonstrate the Collection Review feature later. Click "Save" on the popup when finished.
#. STIGs can also be assigned by double-clicking on a STIG in the Collection Configuration tab, and clicking "Assign Assets" button in the popup. 

.. thumbnail:: /assets/images/AssetCreationPopup.png
   :width: 50% 
   :show_caption: True
   :alt: Asset Creation Popup
   :title: Asset Creation Popup


* The Assets you create and the STIGs you attach to them are presented in the Collection Management tab (In the Asset and STIG panels on the right) as well as the Nav Tree entry for that collection on the left.

Grant Users access to your Collection
======================================

#. Grant other Users access to your Collection by clicking the "New Grant" button in the Grants panel toolbar. Grants are composed of a Username and an Access Level.  Use the Row Pulldown to select Users and their Grants. 

   - When you grant Users access to your Collection, or when you are granted access to another Collection by someone else, that Collection will appear in the Nav Tree on the left upon refresh of the app.

#. In order to be useful, Users with Restricted access to a Collection must be assigned specific STIGs on specific Assets using the "Restricted User access list..." button in the Grants panel toolbar.




.. thumbnail:: /assets/images/collection-manage-grants.png
   :width: 40% 
   :show_caption: True
   :alt: Add Collection Grant
   :title: Add Collection Grant
.. thumbnail:: /assets/images/collection-manage-grants-user-pulldown.png
   :width: 40% 
   :show_caption: True
   :alt: User Pulldown
   :title: User Pulldown


|

You can control what level of access other Users can have to your Collection by assigning them specific Access Levels. 

.. list-table:: The 4 Access Level grants provide differing levels of access to your Collection: 
   :widths: 20 70
   :header-rows: 1
   :class: tight-table

   * - Access Level
     - Description
   * - Restricted
     - Can review specific STIGs on specific Assets only.    
   * - Full
     - Can review any Asset/STIG in the Collection.
   * - Manage
     - Everything in the "Full" level.  Can Add/Remove Assets, STIGs, and Users. Optionally responsible for "Accepting" and "Rejecting" reviews from evaluators.
   * - Owner
     - Everything in the "Manage" level.  Can Delete the Collection.  Responsible for "Accepting" and "Rejecting" reviews from evaluators.

.. thumbnail:: /assets/images/CollectionConfig_Populated.png
      :width: 50% 
      :show_caption: True
      :alt: Collection Management panel with demo Assets
      :title: Collection Management panel with demo Assets

|

Evaluate an Asset for STIG compliance
======================================


#. In the Nav Tree, expand Assets in the Collection you just created.
#. Select an Asset to see its associated STIGs.
#. Select a STIG listed under the Asset.

   * You will now be presented with the Evaluation tab for that STIG on that Asset, which contains several panels. The first Rule in the STIG will be selected for you. 

      * The **STIG Checklist panel** on the left lists every rule in the STIG, their evaluation status, and some other helpful info. Click a Rule to load that Rules information, and start a Review of it. The green highlighting indicates there is an automated check (SCAP) for that rule known to STIG Manager. It does NOT indicate that results for that rule have necessarily been imported. 
      * The **Rule Content panel** in the center contains the selected Rule's info such as the Rule Title, Manual Checks, Fix info, and associated CCIs.
      * The **Review Resources panel** in the top right contains other Reviews you have performed for the selected Rule against other assets, a history of this Review's status, and any Feedback you have received about this Review from the Collection Owner. Reviews from "Other Assets" can be dragged and dropped onto the current assets Review.
      * The **Review panel** in the lower right is where you will actually log your Evaluation of the Rule.  It contains fields to record Review Results, Detail, and Comments.  This panel also indicates who last modified the Review in the "Attributions" box. 

      .. thumbnail:: /assets/images/asset-review.png
         :width: 50% 
         :show_caption: True
         :alt: Asset Review Workspace
         :title: Asset Review Workspace 


#. Select a few Rules and save some Evaluations of them. For now, set a few to "Open," and provide a Comment.  You will notice that you have the option to "Save without submitting" or "Save and Submit" the Evaluations. The "Submitted" status is available if you meet the Review Settings configured for your Collection. Hover over the ``(?)`` symbol to view the applicable :ref:`Collection Settings<manage-collection-workspace>` for Reviews in this Collection. 

   * As you perform reviews, the STIG Checklist panel will update the status columns of each Rule. The bar at the bottom of this panel indicates overall status of the checklist. The toolbar at the top provides options for filtering the current view of the checklist, and the "Checklist" menu provides various functions, including importing results (in .ckl or XCCDF formats) and exporting results in the .ckl format.
   * These evaluations are summarized and reported in the Reports node of the Nav Tree. Findings present just the Open rule evaluations, and can be exported as a spreadsheet or a pseudo-POAM format. Status presents an overall summary of evaluations, showing completion statuses and other info. 


Evaluate multiple Assets at once for STIG compliance
======================================================

#. In the Nav Tree, expand STIGs in the Collection you just created.

   * If you select a STIG, you will see a list of Assets that have that STIG assigned to it. Selecting one of these Assets will open the Evaluation tab described in the previous section.

#. Expand a specific STIG, and select *Collection Review*. 

   * The Collection Review tab presents similar information to the Evaluation tab, but in a condensed view that allows you to review this STIG against all Assets you have access to in this Collection at once. 

   .. thumbnail:: /assets/images/collection-review-being-edited.png
      :width: 50% 
      :show_caption: True
      :alt: Editing in the Collection Review panel
      :title: Editing in the Collection Review panel

#. Select a Rule to review in the top left STIG Checklist Panel. Rule Info will appear in the panel below it.
#. Select an Asset in the Assets panel in the top right. Double-clicking in the Result, Detail, or Comment columns will allow you to edit those fields, either in a pull-down or a text box, as appropriate. Results are saved automatically.

   * Columns in the STIG Checklist panel will update with Statuses and Results as you review.

#. Once Assets are reviewed appropriately, the "Submit" or "Accept" (for Owners only) buttons in the Asset toolbar become available. Click them to set that Asset's Review status. You can set Status on multiple Assets at once by selecting them with a Shift+Click, and then clicking the appropriate toolbar button.
#. If you are an Owner of the Collection, you have the option to "Reject" unsatisfactory Reviews. Select a review and then type some feedback in the lower right panel to guide the Evaluator in fixing their Review. Click "Reject review with this feedback." This review will now be set to a Rejected status, and show up in the Evaluators "Rejected Reviews" report for their further action or review. 
#. If you are an Owner of the Collection, and the option is enabled in Collection Settings, you can set Reviews in your Collection to "Accepted."  

STIG Manager Reports
======================================

Findings Report
-------------------

#. In the Nav Tree, expand Reports in the Collection you just created.
#. Click the Findings report.

   * This report lists every Open review in the Collection. It can be aggregated by Rule, Group, or CCI, and filtered by STIG.
   * From the bottom bar of the Aggregated Findings panel, a .csv and a POAM-like export is available for the Rule and Group aggregations.

#. Select a Finding in the Aggregated Findings panel on the left to display the Assets with those findings in the Individual Findings Panel on the right. 
#. Click the "Generate POA&M..." button in the bottom bar of the Aggregated Findings panel.

   * You will be prompted for a little more information, which will be prepopulated into the POA&M that will be generated for you.


.. thumbnail:: /assets/images/FindingsReport.png
      :width: 50% 
      :show_caption: True
      :alt: The Findings Report
      :title: The Findings report


Status Report
-------------------

#. Click the Status report in the Nav Tree.
 
   * The Status report provides information about the progress of STIG Evaluations. By default it will list each Asset, and their attached STIGs. 

#. Click the shield icon in the Grouping box in the top left of the Status report. 
   
   * The Status report will pivot to list each STIG that is a part of this Collection, and each Asset that has that STIG attached to it.
 
#. Click the down arrow in bottom toolbar to export this Status report as a .csv.


.. image:: ../assets/images/status-report.png
   :width: 50% 
   :show_caption: True
   :alt: The Status Report
   :title: The Status report
 

| 

.. rubric:: Congratulations! You've just Managed some STIGs!

