
.. _permissions-and-data:

STIG Manager Data and Permissions
====================================




Data Model
--------------------

STIG Manager's primary organizational structure is the Collection. A Collection can be created to mirror components of an RMF Package, requirements identified in a Security Assessment Plan, or an entirely different principle that may be more convenient, such as by an organization's Lab or by Asset OS.

Collections are composed of:
  * Assets
  * STIGs attached to those Assets
  * Reviews of the Rules that compose each attached STIG
  * User Grants providing access to some or all of the Assets/STIGs in that Collection
  * Reports providing Status and Findings information



"Checklists" - .ckl and XCCDF 
---------------------------------

It is important to note that STIG Manager does not retain the actual .ckl or XCCDF files that are imported into it in any way. The files are parsed for the information they contain, and that information is stored in the database. Manual edits via the UI and new imports all contribute to the current state of an Assets reviews as presented by the UI and API. NEW .ckl or XCCDF files are generated on demand reflecting the current state of a Collections Assets, STIGs, and reviews. 
This approach provides several advantages:

- Reviews are associated with specific Rule IDs 
- Review attribution info, status, and metadata can be attached to each individual Review. 
- Checklists are generated using the **Reference** STIGs imported and maintained by the Application Manager. This alleviates issues with partial checklists, unauthorized overrides, etc.  



Other terms 
NIST 800xxxx informed the options available for review, which are used in the api, but not always the UI.

where needed, NIST document used for clarity. 


XCCDF
__________

STIG Manager serializes Reviews in XCCDF format with a STIG Manager namespace (``xmlns:sm="http://github.com/nuwcdivnpt/stig-manager"``). Correct serialization was validated using `the official NIST validation tool <https://csrc.nist.gov/CSRC/media/Projects/Security-Content-Automation-Protocol/specifications/xccdf/1.2/xccdfval-1.2.0.zip>`_.

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
--------------------

Collection Access is controlled solely by the Grants that Collection Owners and Managers can delegate to other users. 
See the :term:`User` definition for more info on these grants.



API Endpoints, Scopes, and Privilege Invocation
-------------------------------------------------

STIG Manager recognizes two "privileges" or "roles" that can be granted to users via configuration in the OIDC provider. 

Users with the **create_collection** privilege can create new Collections of their own, but are otherwise ordinary users. 

Users with the **admin** privilege must explicitly invoke the "elevate" parameter in queries to the API to make use of their privilege. In our reference UI, this parameter is sent when certain "Application Management" functions are invoked, such as requesting a list of all Collections, or creating a new Grant in a Collection they do not otherwise have access to. 


These privileges must be present in the token presented to the API in order to be successfully invoked. 
  
  
See our :ref:`Authentication and Identity  <authentication>` documentation for more information about how these scopes and privileges interrelate. 









