.. _user-quickstart:


User Walkthrough
########################################

This User Walkthrough will walk you through a typical use case for STIG Manager, from creating your own Collection, creating Assets in that Collection, to evaluating STIGs and creating a POAM-style spreadsheet from your findings. Depending on your role in your organization, not all of these steps may apply to you, but should be helpful in providing context for the use of this tool. If you are comfortable, feel free to skip around using the sidebar navigation to the left.

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


The Navigation Rail
======================================

The Nav Rail runs along STIG Manager's left edge, and provides Users a list of the Collections they have access to, the STIG Library, and the What's New page. For Users with the App Manager privilege, an Admin entry is also available. Click the chevron at the top of the Nav Rail to expand it and show labels.


Create your first Collection
======================================

* **You may have already been given access to some Collections in STIG Manager, or you may not have the Collection Creator privilege. If your Nav Rail is already sufficiently populated, feel free to skip to the Evaluate an Asset for STIG compliance section.**

By default, most users will have the Collection Creator privilege, allowing them to create their own Collection of Assets and their STIGs, and to provide access to them to other users in the system. 

#. After logging into the system, click the green *+* button next to Collections in the Nav Rail on the left.

.. thumbnail:: /assets/images/new/nav-tree.png
      :width: 25% 
      :show_caption: True
      :title: Navigation Rail


#. You will be prompted for your Collection name and a description.  On Create, you will be automatically made an Owner of the new Collection, and will be taken to the Management workspace for this new Collection. You can access the Management workspace later from the Management tab of the Collection Dashboard.


   .. thumbnail:: /assets/images/new/create-collection-popup.png
      :width: 50%
      :show_caption: True 
      :alt: Create Collection Popup
      :title: Create Collection Popup



Create Assets in your Collection
======================================

#. From the Assets page of the Management workspace, use the "Create" button in the toolbar to create a couple sample Assets. You can also attach STIGs from the "Create new Asset" popup at this time. The only required field is "Name," which must be unique in this Collection.

   * You can change all the properties of your Asset, including attached STIGs, later by selecting the Asset and using the "Modify" button in the Assets toolbar.  

.. thumbnail:: /assets/images/new/collection-manage-asset-create-button.png
   :width: 50% 
   :show_caption: True
   :alt: Create Asset Button
   :title: Create Asset Button


.. note::
   Assets and their STIG attachments can also be created automatically in bulk by importing STIG Viewer .ckl or XCCDF files using the "Import CKL(B) or XCCDF..." button. :ref:`More info about the Collection Builder function can be found in the User Guide.<Collection Builder>`


Attach STIGs to Assets in your Collection
============================================

#. Add or remove STIGs by selecting an Asset on the Assets page and clicking "Modify", then moving STIGs between the Available and Assigned lists in the STIG Assignments section of the Asset pop-up. Try to attach the same STIG to more than one Asset. It will help demonstrate the Collection Review feature later. Click "Save asset" on the popup when finished.
#. STIGs can also be assigned from the STIGs page of the Management workspace: click "Assign", choose a Benchmark ID, and move Assets into the Assigned list. 

.. thumbnail:: /assets/images/new/create-asset.png
   :width: 50% 
   :show_caption: True
   :alt: Asset Creation Popup
   :title: Asset Creation Popup


* The Assets you create and the STIGs you attach to them are presented on the Assets and STIGs pages of the Management workspace, as well as in the Assets and STIGs tabs of the Collection Dashboard.


.. _create-a-grant:

Grant Users Roles in your Collection
======================================

#. Grant other Users access to your Collection by clicking the "Add Grants..." button on the Users & Grants page of the Management workspace. Grants are composed of a Grantee and a Role. See the :ref:`Roles and Access<roles-and-access>` section for more information.


   - When you grant Users access to your Collection, or when you are granted access to another Collection by someone else, that Collection will appear in the Nav Rail on the left upon refresh of the app.

#. By default, Users with a Restricted Role cannot access any Assets in your Collection. Create an Access Control List for these users by clicking on the "target" icon on the Grant's row. 

   * This will open a popup where you can select specific Assets, STIGs, or Labels that this User can access. Multiple Rules can be created with varying level of Access (Read, Read/Write, or None) to the Assets in the Collection.  Click "Save" when finished.


.. thumbnail:: /assets/images/new/collection-manage-grants.png
   :width: 40% 
   :show_caption: True
   :alt: Add Collection Grant
   :title: Add Collection Grant

.. thumbnail:: /assets/images/new/collection-manage-new-grants-popup.png
   :width: 40% 
   :show_caption: True
   :alt: User Pulldown
   :title: User Pulldown


|



.. thumbnail:: /assets/images/new/collection-manage-populated.png
      :width: 50% 
      :show_caption: True
      :alt: Collection Management panel with demo Assets
      :title: Collection Management panel with demo Assets

|

Evaluate an Asset for STIG compliance
======================================


#. In the Nav Rail, open the Collections list and click on the Collection you just created to open the Collection Dashboard.
#. Select the "Assets" tab at the top of the Collection Dashboard.
#. Select an Asset to see its associated STIGs.
#. Click the "shield" icon on a STIG listed under the Asset.

   * You will now be presented with the Asset Review workspace for that STIG on that Asset, which contains several parts.

      * The **STIG Checklist grid** lists every Rule in the STIG, their evaluation status, and some other helpful info. Click a Rule to load that Rule's information on the right and open the Review editor.
      * The **Rule panel** on the right contains the selected Rule's info such as the Rule Title, Manual Checks, Fix info, and associated CCIs.
      * The **Review editor** pops up over the checklist when you click a Rule, and is where you will actually log your Evaluation of the Rule.  It contains fields to record Review Results, Detail, and Comments, Status buttons, and an attribution line that indicates who last modified the Review.
      * The **Review Resources** section, expanded from the bottom of the Review editor, contains a history of this Review, any Feedback you have received about this Review from the Collection Owner, and other Reviews that have been performed for the selected Rule against other assets. Use the "Apply" button on one of those Reviews to copy it to the current asset. 

      .. thumbnail:: /assets/images/new/asset-review.png
         :width: 50% 
         :show_caption: True
         :alt: Asset Review Workspace
         :title: Asset Review Workspace 


#. Select a few Rules and save some Evaluations of them. For now, set a few to "Open," and provide a Comment.  Click "Save" or "Submit" in the editor to save your Evaluation and set its status. The "Submitted" status is available if you meet the Review Settings configured for your Collection. Required fields are marked with an asterisk; see the :ref:`Collection Settings<manage-collection-workspace>` for Reviews in this Collection. 

   * As you perform reviews, the STIG Checklist grid will update the status columns of each Rule. The bar at the bottom of the grid indicates overall status of the checklist. The toolbar at the top provides Search and Filter options, Submit All and Accept All buttons, and the "Checklist" menu, which includes importing results (in .ckl, .cklb, or XCCDF formats) and exporting results.
   * These evaluations are summarized in the Collection Dashboard. The Findings tab presents just the Open rule evaluations, and can be exported as a .csv or a POAM-style spreadsheet. The STIGs, Assets, and Labels tabs present overall summaries of evaluation progress. 


Evaluate multiple Assets at once for STIG compliance
======================================================

#. From the Collection Dashboard, select a STIG from the STIGs panel in the Collection you just created.

   * If you select a STIG, you will see a list of Assets that have that STIG assigned to it. Clicking the shield icon on one of these Assets will open the Asset Review workspace described in the previous section.

#. Click the shield icon on the STIG you want to evaluate to open up the Collection Review Workspace.

   * The Collection Review workspace presents similar information to the Asset Review workspace, but in a condensed view that allows you to review this STIG against all Assets you have access to in this Collection at once. 

   .. thumbnail:: /assets/images/new/collection-review-being-edited.png
      :width: 50% 
      :show_caption: True
      :alt: Editing in the Collection Review panel
      :title: Editing in the Collection Review panel

#. Select a Rule to review in the STIG Checklist grid at the top. Rule Info will appear in the panel on the right.
#. Click an Asset in the Reviews grid below the checklist to open the Review editor, where you can edit the Result, Detail, and Comment. Your changes are saved when you select a status with the Save, Submit, or Accept button.

   * Columns in the STIG Checklist panel will update with Statuses and Results as you review.

#. Once Assets are reviewed appropriately, the "Submit" or "Accept" (for Owners only) buttons in the Reviews grid toolbar become available. Select one or more Assets with the checkboxes and click the appropriate toolbar button to set their Review status, or use "Batch edit" to change the Result, Detail, and Comment of all of them at once.
#. If you are an Owner of the Collection, you have the option to "Reject" unsatisfactory Reviews. Select a review and then click the "Reject" button in the Reviews grid toolbar. Provide some feedback in the popup that will guide the Evaluator in fixing their Review. Click "Reject review with this feedback." This review will now be set to a Rejected status, and the feedback is shown to the Evaluator in the Status Text tab of the Review Resources for their further action. 
#. If you are an Owner of the Collection, and the option is enabled in Collection Settings, you can set Reviews in your Collection to "Accepted."  

STIG Manager Reports
======================================

Findings Report
-------------------

#. From the Collection Dashboard, click the "Findings" tab.

   * This report lists every Open review in the Collection. It can be aggregated by Rule, Group, or CCI, and filtered by STIG.
   * From the bottom bar of the Aggregated Findings panel, a .csv and a POAM-style spreadsheet export is available for the Rule and Group aggregations.

#. Select a Finding in the Aggregated Findings panel on the left to display the Assets with those findings in the Individual Findings Panel on the right.
#. Click the "Generate POA&M..." button in the bottom bar of the Aggregated Findings panel.

   * You will be prompted for a little more information, which will be prepopulated into the POA&M cells that will be generated for you.
   * POA&Ms can take different forms, and track more information than is available in STIG Manager. The POA&M output from STIG Manager is intended to be used for reference when populating your official POA&M documents with STIG finding information, and not as a replacement for artifacts that may be directly imported into eMASS or other RMF tools.


.. thumbnail:: /assets/images/new/findings-report.png
      :width: 50% 
      :show_caption: True
      :alt: The Findings Report
      :title: The Findings report


 

| 

.. rubric:: Congratulations! You've just Managed some STIGs!

