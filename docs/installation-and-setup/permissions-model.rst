
.. _permissions-and-data:

Permissions and Data
=========================


"Checklists"
----------------------

It is important to note that STIG Manager does not retain the actual .ckl or XCCDF files that are imported into it in any way. The files are parsed for the information they contain, and that information is stored in the database. Manual edits via the UI and new imports all contribute to the current state of an Assets reviews as presented by the UI and API. NEW .ckl or XCCDF files are generated on demand reflecting the current state of a Collections Assets, STIGs, and reviews. 
This approach provides several advantages:

- Reviews are associated with specific Rule IDs 
- Review attribution info, status, and metadata can be attached to each individual Review. 
- Checklists are generated using the **Reference** STIGs imported and maintained by the Application Manager. This alleviates issues with partial checklists, unauthorized overrides, etc.  



Other terms 
NIST 800xxxx informed the options available for review, which are used in the api, but not always the UI.

where needed, NIST document used for clarity. 




Data Model
--------------------

STIG Manager's primary organizational structure is the Collection. A Collection can be created to mirror components of an RMF Package, requirements identified in a Security Assessment Plan, or an entirely different principle that may be more convenient, such as by an organization's Lab or by Asset OS.

Collections are composed of:
  * Assets
  * STIGs attached to those Assets
  * Reviews of the Rules that compose each attached STIG
  * User Grants providing access to some or all of the Assets/STIGs in that Collection
  * Reports providing Status and Findings information





 Permissions
 --------------------

Collection Access is controlled solely by the Grants that Collection Owners and Managers can delegate to other users. 
See the :term:`User` definition for more info on these grants.




API Endpoints, Scopes, and Privileges
----------------------------------------

STIG Manager recognizes two "privileges" or "roles" that can be granted to users via configuration in the OIDC provider. 

Users with the **create_collection** privilege can create new Collections of their own, but are otherwise ordinary users. 

Users with the **admin** privilege must explicitly invoke the "elevate" parameter in queries to the API to make use of their privilege. In our reference UI, this parameter is sent when certain "Application Management" functions are invoked, such as requesting a list of all Collections, or creating a new Grant in a Collection they do not otherwise have access to. 


These privileges must be present in the token presented to the API in order to be successfully invoked. 
  
  
  
  
See our :ref:`Authentication and Identity  <authentication>` documentation for more information about how these scopes and privileges interrelate. 









