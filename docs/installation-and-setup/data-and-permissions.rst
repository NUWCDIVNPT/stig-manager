
.. _data-and-permissions:

STIG Manager API Data Representations and Permissions
##########################################################################




Data Model
====================================================

STIG Manager's primary organizational structure is the Collection. A Collection can be created to mirror components of an RMF Package, requirements identified in a Security Assessment Plan, or an entirely different principle that may be more convenient, such as by an organization's Lab or by Asset OS.

Collections are composed of:
  * Assets
  * STIGs attached to those Assets
  * Reviews of the Rules that compose each attached STIG
  * User Grants providing access to some or all of the Assets/STIGs in that Collection
  * Reports providing Status and Findings information

Collections, Assets, and Reviews all support a JSON field called "metadata" for general use that can be used to enhance functionality and associate arbitrary data with those elements. The project is exploring best practices and uses for this feature. Clients that "play nice" with this field would be expected to preserve metadata already there unless they put it there, perhaps in a nested object with their client name as the Key.


Reference STIGs
---------------------------------------------

STIG Manager uses a set of Reference STIGs that it makes available for assignment to Assets, tracks Rule evaluation, and against which it calculates all metrics. 
These Reference STIGs must be imported and updated periodically as new STIGs are released or updates are made. It is responsibility of a User with the "Application Management" (or "admin") role to import these official STIGs and keep them updated. Usually, these STIGs are released by DISA on a quarterly schedule. 

Wherever the content of a STIG is displayed (STIG Rules, Rule Titles, Rule Descriptions, Fix Texts, Severities, etc.) this data is drawn from the Reference STIG imported by the Application Manager. It is important to note the distinction here between STIG content and "Review" content, which is usually drawn from imported .ckl files or manual results inputted into STIG Manager by Reviewers. This "Review" content only affects the "Review" or "Evaluation" portion of the data displayed in STIG Manager. They cannot change Reference STIG content via .ckl imports. 


"Checklists" - .ckl and XCCDF 
---------------------------------------------

Assets and the STIGs assigned to them are generally presented as Checklists, the lists of Rules and Checks that compose the assigned STIG, and the Reviews that satisfy those Rules. STIG Manager associates Reviews with specific content of Rules (Rule Version and Rule Check Content), independent of the STIGs that are assigned to Assets. This allows for different and more useful presentations of the data than when the Reviews are expressed in flat files, such as .ckl or XCCDF files. 

It is important to note that STIG Manager does not retain the actual .ckl or XCCDF files that are imported into it in any way. The files are parsed for the information they contain, and that information is stored in the database. Manual edits via the UI and new imports all contribute to the current state of an Assets reviews as presented by the UI and API. NEW .ckl or XCCDF files are generated on demand reflecting the current state of a Collections Assets, STIGs, and reviews. 
This approach provides several advantages:

- Reviews are associated with the specific content of a Rule (Rule Version and Rule Check Content).
- Review attribution info, status, and metadata can be attached to each individual Review. 
- Checklists are generated using the **Reference** STIGs imported and maintained by the Application Manager. This alleviates issues with partial checklists, unauthorized overrides, etc.  




.. _ckl-processing:

Processing .ckl Files 
________________________

When the STIG Manager Client imports data from :term:`.ckl files <ckl>`, in the simplest case it will attempt to match (and, in some instances, create) the Asset specified in the .ckl's ``<HOST_NAME>`` element.  However, if the ``<ASSET><WEB_OR_DATABASE>`` element in the .ckl has a value of ``true``, special processing is invoked. This processing will attempt to match the ``<HOST_NAME>``, ``<WEB_DB_SITE>`` and ``<WEB_DB_INSTANCE>`` values in the .ckl with Asset metadata when identifying the Asset.  When the STIG Manager Client creates Assets from .ckls with these elements populated, it will populate the same Asset metadata according to the table below. 

Conversely, when STIG Manager produces a .ckl file from an Asset that has the below metadata values set, it will populate the appropriate .ckl elements. 

The following metadata properties are used when the value of ``<ASSET><WEB_OR_DATABASE>``  is ``true``:

.. list-table:: **CKL elements map to STIG Manager Asset metadata**
   :widths: 20 20 60
   :header-rows: 1
   :class: tight-table

   * - ``<ASSET>`` Child Element
     - Asset metadata
     - Note
   * - ``<WEB_OR_DATABASE>``
     - ``cklWebOrDatabase``    
     - When set to true, invokes additional processing using the below elements and metadata     
   * - ``<HOST_NAME>``
     - ``cklHostName``    
     - This value will populate the ``<HOST_NAME>`` element of a ckl, as opposed to the Asset name in other cases.
   * - ``<WEB_DB_SITE>``
     - ``cklWebDbSite``
     - No specific purpose for STIG Manager, other than contributing to Asset identification 
   * - ``<WEB_DB_INSTANCE>``
     - ``cklWebDbInstance``          
     - No specific purpose for STIG Manager, other than contributing to Asset identification 

   
If the importer needs to create an Asset, it will set this metadata and set the initial Asset name to ``<HOST_NAME>-[<WEB_DB_SITE> | "NA"]-[<WEB_DB_INSTANCE> | "NA"]``. The Asset name is not meaningful (to STIG Manager) and it can be changed by the user later, if required.


.. thumbnail:: /assets/images/asset-metadata-and-ckl-elements.png
      :width: 75% 
      :show_caption: True
      :title: Corresponding Asset Metadata and .ckl elements


|

.. note::
   See the :ref:`import-options` section of this document for information about STIG Manager's review import options.  


|

Processing XCCDF Files
__________________________________

STIG Manager supports serializing Reviews in XCCDF format with a STIG Manager namespace (``xmlns:sm="http://github.com/nuwcdivnpt/stig-manager"``). Correct serialization was validated using `the official NIST validation tool <https://csrc.nist.gov/CSRC/media/Projects/Security-Content-Automation-Protocol/specifications/xccdf/1.2/xccdfval-1.2.0.zip>`_.

The XCCDF format is more expressive and extensible than the .ckl format, so additional data can be included.
Not all tools will recognize elements making use of the STIG Manager namespace, but the files will still validate and test result information will be recognized. STIG Manager itself can re-import it's own XCCDF files and will understand the STIGMan namespace fields. 

STIGMan serializes elements containing data that are STIGMan specific, as well as other elements required to express test results and stay in accordance with the NIST XCCDF specification:

  - A STIGMan XCCDF file contains these elements and features:

    - ``<Benchmark><metadata>``
    - ``<Benchmark><Group>`` and required children
    - ``<Benchmark><TestResult>`` and required children
  - Identifies STIG Manager as the test system ``cpe:/a:nuwcdivnpt:stig-manager:[version]``
  - Serializes STIG Manager Asset properties and metadata as children of ``<Benchmark><TestResult><target-facts>``
    - Asset properties are described by ``<fact name="tag:stig-manager@users.noreply.github.com,2020:asset:[property]" ``
    - If an Asset metadata key begins with ``urn:``, the fact name is equal to the metadata key
    - All other Asset metadata items are described by ``<fact name="tag:stig-manager@users.noreply.github.com,2020:asset:metadata:[key]"``
  - Serializes STIG Manager Review properties (detail, comment, resultEngine) as child elements under ``<Benchmark><TestResult><rule-result><check><check-content>``. Each child element is scoped to the STIG Manager namespace. The following elements are used:

    - ``sm:detail``
    - ``sm:comment``
    - ``sm:resultEngine``

      -  ``sm:type``
      - ``sm:product``
      - ``sm:version``
      - ``sm:time``
      - ``sm:checkContent``

        - ``sm:location``
        - ``sm:component``
      - ``sm:overrides``

        - ``sm:authority``
        - ``sm:oldResult``
        - ``sm:newResult``
        - ``sm:remark``




Permissions
======================

Grants
------------------------------------------------

Individual access to a Collection is controlled solely by the Grants that Collection Owners and Managers can delegate to other users. 
See the :term:`User` definition for more info on these grants. This is access to Collections is distinct from overall Application access, which is described below. 



Application Access, API Endpoints, Scopes, and Privilege Invocation
------------------------------------------------------------------------

Overall access to the STIG Manager application is controlled by the OIDC provider. 

STIG Manager recognizes two "privileges" or "roles" that can be granted to users via configuration in the OIDC provider. 

Users with the **create_collection** privilege can create new Collections of their own, but are otherwise ordinary users. 

Users with the **admin** privilege must explicitly invoke the "elevate" parameter in queries to the API to make use of their privilege. In our reference UI, this parameter is sent when certain "Application Management" functions are invoked, such as requesting a list of all Collections, or creating a new Grant in a Collection they do not otherwise have access to. 

These **privileges** must be present in the token presented to the API in order to be successfully invoked. 

Access to specific endpoints is controlled by the **scopes** present in a user's token. The scopes granted to users can be configured in the OIDC provider. Certain user types may only need access to certain scopes. For example, an "Application Manager" type user might need access to the ``stig-manager:stig`` scope so that they can update the Reference STIGs in the app, but normal users might only need the ``stig-manager:stig:read`` scope, granting them read-only access to the Reference STIGs.  All configuration of this type is done in the OIDC provider. 
  
See our :ref:`Authentication and Identity <authentication>` documentation and our `API Specification <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml>`_ for more information about how these scopes and privileges interrelate. 



Database Entity Relationship Diagrams
===============================================

The following diagram may not always be up to date. Always refer to the implemented db structure as the authoritative source for this information. 


.. thumbnail:: /assets/images/eer-stigman-wide.svg
      :width: 75% 
      :show_caption: True
      :title: Entity Relationship Diagram representation of STIG Manager's MySQL data. 

`View the enlarged ERD Document here. <../_images/eer-stigman-wide1.svg>`_
