# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
# import os
# import sys
# sys.path.insert(0, os.path.abspath('.'))
import hashlib
import shutil
import urllib.request
from pathlib import Path

import sphinx_rtd_theme


# -- API Reference browser assets --------------------------------------------
# The standalone API Reference browser pages (_extra/api-reference/index.html
# and log-socket.html) require files that are generated at build time and not
# committed:
#
#   _extra/api-reference/scalar.standalone.js
#       The Scalar API Reference bundle, downloaded from the jsDelivr CDN,
#       pinned to a specific version and verified against a checksum. The
#       download is skipped if the file already exists, so a previously
#       fetched copy allows fully offline builds.
#
#   _extra/api-reference/stig-manager.yaml
#   _extra/api-reference/log-socket.yaml
#       Copied from api/source/specification/ so each documentation build
#       presents the API specifications it was built alongside.

scalar_version = '1.65.0'
scalar_sha256 = 'b239df03d69061d849814ee8349c7bdec56441d00aa836ede64dd94b2ef1ded0'

docs_dir = Path(__file__).resolve().parent
api_reference_dir = docs_dir / '_extra' / 'api-reference'


def fetch_scalar_bundle():
    dest = api_reference_dir / 'scalar.standalone.js'
    if dest.exists():
        return
    url = f'https://cdn.jsdelivr.net/npm/@scalar/api-reference@{scalar_version}/dist/browser/standalone.js'
    try:
        data = urllib.request.urlopen(url).read()
    except OSError as e:
        raise RuntimeError(
            f'Could not download the Scalar bundle from {url} ({e}). '
            f'For offline builds, place a copy of the file at {dest} before building.'
        ) from e
    digest = hashlib.sha256(data).hexdigest()
    if digest != scalar_sha256:
        raise RuntimeError(
            f'Checksum mismatch for {url}: expected {scalar_sha256}, got {digest}'
        )
    dest.write_bytes(data)


def copy_api_specifications():
    for filename in ('stig-manager.yaml', 'log-socket.yaml'):
        src = docs_dir.parent / 'api' / 'source' / 'specification' / filename
        dest = api_reference_dir / filename
        if src.exists():
            shutil.copyfile(src, dest)
        elif not dest.exists():
            raise RuntimeError(
                f'API specification not found at {src} and no existing copy at {dest}. '
                f'When building outside the repository, place a copy of the specification at {dest}.'
            )


fetch_scalar_bundle()
copy_api_specifications()


# -- Project information -----------------------------------------------------

project = 'STIG Manager'
copyright = '2026 U.S. Federal Government (in countries where recognized)'
author = 'cd-rite'


# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
# extensions = [
# ]
extensions = [
    'sphinx_rtd_theme',
    'sphinxcontrib.images',
    'sphinx.ext.todo',
    'myst_parser',    
    'sphinx_tabs.tabs',
    'sphinx_rtd_dark_mode'
]

todo_include_todos = True
# user starts in light or dark mode
default_dark_mode = True

images_config = {
    'override_image_directive': True,
    'default_image_width': '50%',
    'default_group': 'default'
}


# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']


# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
# html_theme = 'alabaster'
# html_theme = "pydata_sphinx_theme"
html_theme = "sphinx_rtd_theme"
html_theme_options = {
    'prev_next_buttons_location': 'both',
    # 'logo_only': True,
    'sticky_navigation': True
}

# html_style = 'css/default.css'

github_doc_root = 'https://github.com/cd-rite/stig-manager/tree/readTheDocs/docs'


# html_logo = './_static/images\shield-green-check.svg'
html_logo = 'assets/images/shield-green-check.svg'

# Files copied verbatim to the output root after the built pages. Contains the
# standalone API Reference browser page and its build-time generated assets.
html_extra_path = ['_extra']

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ['_static']

# These paths are either relative to html_static_path
# or fully qualified paths (eg. https://...)
html_css_files = [
    'css/custom.css',
    # 'css/custom-pydata-theme.css',
]

html_js_files = [
    'js/custom.js',
]

# html_context = {
# "display_github": True, # Add 'Edit on Github' link instead of 'View page source'
# "last_updated": True,
# "commit": False,
# "github_url": 'https://github.com/cd-rite/stig-manager/tree/readTheDocs/docs'

# }

