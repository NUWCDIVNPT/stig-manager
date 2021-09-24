.. _care-and-feeding-doc:


STIG Manager Care and Feeding
###############################################


.. rubric:: Ongoing tasks

To keep STIG Manager functioning optimally, certain simple tasks must be performed periodically.

These tasks, and and other optional support activities, are listed below. 



.. _stig-updates:

Update STIG and SCAP Information
==================================================

DISA releases new versions of many of their STIGs and SCAP files every Quarter.  They also occasionally release them off this schedule. Keep an eye on DISA's  `https://public.cyber.mil/stigs/ <https://public.cyber.mil/stigs/>`_ and `https://cyber.mil/stigs/ <https://cyber.mil/stigs/>`_ sites for updates. 

These updates must be brought into STIG Manager if you wish the updates to be reflected in STIG Manager's reports and presentation. STIGs must be imported by someone with Administrator privileges in the STIG Manager instance:

#. Download the STIGs you want to update from `DISA. <https://public.cyber.mil/stigs/>`_
#. Upload the .zip files to STIG Manager via the ``Administration -> STIG and SCAP Benchmarks`` item in the Navigation Tree.
#. If you import SCAP files in XCCDF format as well, the potential automated checks will be highlighted when viewing Checklists. 

.. note::
  You can import the entire Quarterly Library Compilation at once, or individual STIGs. 


.. thumbnail:: /assets/images/admin-stigs-import.png
      :width: 50% 
      :show_caption: True
      :title: STIG Imports


|


By default, STIG Manager displays Checklists and Reviews according to the latest version of the STIG.  It will also recalculate statistics against the latest version(s) of the STIGs. No other action is needed after an update. Older versions of STIGs can still be selected from the Review Workspace checklist pulldown menu. 

.. thumbnail:: /assets/images/asset-review-stig-revisions.png
      :width: 50% 
      :show_caption: True
      :title: STIG Revision Selection

|


STIG Manager tracks Reviews by their Rule ID, not STIG ID. In most cases, new STIG revisions will have substantially the same ruleset as previous revisions. This means that most of the time, when you update STIGs in STIG Manager, most Assets will carry most of their existing reviews forward and you will not have to start from scratch.

|

.. _pre-registering-users:


Pre-Registering Users
==================================================

Typically, Users must access the system at least once before they can be given Collection Grants.  STIG Manager will automatically creates a user record when a new Authenticated User accesses the system.  If you want to make assignments to users before they have accessed the system, it is possible to pre-register them from the ``Administration -> User Grants`` workspace.  Click the Pre-register User button, and enter their username. This username must match exactly the username that will be provided by the Authentication Provider when the user eventually shows up. 

.. thumbnail:: /assets/images/user-admin-prereg-button.png
      :width: 50% 
      :show_caption: True
      :title: STIG Revision Selection

.. thumbnail:: /assets/images/user-admin-prereg-popup.png
      :width: 50% 
      :show_caption: True
      :title: STIG Revision Selection

|

.. _review-history-pruning:


Review History Pruning
==================================================

STIG Manager keeps a history of every change made to a Review. Eventually, these Review History entries will become irrelevant but will continue to take up space.
It is suggested that you periodically prune your stored review history (in accordance with your data retention policy) with the Delete Review History endpoint of the API.  Further information on this feature will be provided in the future. 


|

.. _automated-imports:

Configure a Source of Automated Evaluations
==================================================

There are several tools available that will automatically assess many of your STIGs, and provide output in .ckl or XCCDF output.  Tools such as Evaluate STIG and SCC can be configured to populate file system folders with their evaluation results. If you find yourself with a lot of these .ckl files, you may find the STIGMan Watcher tool useful.  

STIGMan Watcher is a lightweight command line utility that can be configured to monitor a file system folder for .ckl files or XCCDF results, and automatically submit them to a Collection on a STIG Manager instance.  You could potentially have many STIGMan Watchers running, each monitoring a file folder and importing results into particular STIGMan Collections. 

More information can be found along with the source code on `GitHub <https://github.com/NUWCDIVNPT/stigman-watcher>`_ and with the `NodeJs package. <https://www.npmjs.com/package/stigman-watcher>`_


.. note::
   Be sure to give the STIGMan Watcher user permissions on your Collection!




