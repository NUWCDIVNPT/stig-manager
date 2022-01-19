.. _documentation:


STIG Manager Documentation
########################################


The STIG Manager OSS Documentation is written in reStructuredText. Sphinx and the Read The Docs theme is used to generate the site, which is located in the project repo and hosted on Read The Docs: `stig-manager.readthedocs.io <https://stig-manager.readthedocs.io/>`_ and on GitHub Pages: `nuwcdivnpt.github.io <https://nuwcdivnpt.github.io/stig-manager/#/>`_


Documentation Build
----------------------

To build the documentation locally:

#. Clone the STIG Manager repository from GitHub.
#. Install Python
#. Navigate to /docs folder of the repository. 
#. Install Sphinx, its extensions, and other required python modules using the ``pip install -r requirements.txt`` command.
#. Depending on the OS you are using, build the documentation using make.bat or the Makefile, and specify html as the format. Windows PowerShell example: ``./make html``

By default, the build product is located in ``_build`` in the docs directory. 




