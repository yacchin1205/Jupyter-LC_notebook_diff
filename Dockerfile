FROM jupyter/scipy-notebook:latest

USER root

### extensions for jupyter
COPY . /tmp/notebook_diff
RUN pip --no-cache-dir install jupyter_nbextensions_configurator \
    /tmp/notebook_diff
RUN jupyter labextension enable lc_notebook_diff

RUN jupyter nbclassic-extension install --py jupyter_nbextensions_configurator --sys-prefix && \
    jupyter nbclassic-extension enable --py jupyter_nbextensions_configurator --sys-prefix && \
    jupyter nbclassic-serverextension enable --py jupyter_nbextensions_configurator --sys-prefix && \
    jupyter nbclassic-extension install --py lc_notebook_diff --sys-prefix && \
    jupyter nbclassic-extension enable --py lc_notebook_diff --sys-prefix && \
    fix-permissions /home/$NB_USER

USER $NB_USER

RUN cp -fr /tmp/notebook_diff/html /home/$NB_USER/
