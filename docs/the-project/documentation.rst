.. _documentation:


Documentation
########################################


The STIG Manager OSS Documentation is written in reStructuredText. Sphinx and the Read The Docs theme is used to generate the site, which is located in the project repo and hosted on Read The Docs: `stig-manager.readthedocs.io <https://stig-manager.readthedocs.io/>`_ and on GitHub Pages: `nuwcdivnpt.github.io <https://nuwcdivnpt.github.io/stig-manager/#/>`_


Documentation Build
----------------------

To build the documentation locally:

#. Clone the STIG Manager repository from GitHub.
#. Install Python
#. Install Sphinx ``pip install sphinx``
#. Navigate to /docs folder of the repository. 
#. Install the following sphinx extensions using the ``pip install`` command (listed in the extensions array of the local conf.py file):

    - ``sphinx-rtd-theme``
    - ``recommonmark``
    - ``sphinxcontrib.images``

#. Depending on the OS you are using, build the documentation using make.bat or the Makefile, and specify html as the format. Windows PowerShell example: ``./make html``

By default, the build product is located in ``_build`` in the docs directory. 




